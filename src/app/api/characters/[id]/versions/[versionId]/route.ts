import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { diffObjects } from '@/lib/audit'
import { getUserFromRequest, checkPermission } from '@/lib/auth'

interface Params {
  params: { id: string; versionId: string }
}

/**
 * GET /api/characters/[id]/versions/[versionId]
 *
 * Returns the stored snapshot for the given character version along with a
 * diff between the snapshot and the current character.  The diff is a
 * simple object with keys representing changed fields and values showing
 * the before/after state.  If the version or character does not exist
 * a 404 response is returned.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { id, versionId } = params
  // Authorization: user must have read access for character
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, id, 'READ')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  // Load the version snapshot
  const version = await prisma.charVersion.findUnique({ where: { id: versionId } })
  if (!version || version.characterId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Load current character
  const character = await prisma.character.findUnique({ where: { id } })
  if (!character) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Compute diff between snapshot and current
  const diff = diffObjects(version.data, character)
  return NextResponse.json({ version, diff })
}

/**
 * POST /api/characters/[id]/versions/[versionId]
 *
 * Restores the given version by updating the character with all fields
 * stored in the snapshot.  It creates a new version snapshot for the
 * current state before restoration and records an audit entry.  The
 * returned payload includes the updated character and the refreshed
 * version list (limited to the latest 100 snapshots).
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { id, versionId } = params
  const user = await getUserFromRequest(req)
  // Permission: must have write permission to restore version
  if (!checkPermission(user, id, 'WRITE')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  const version = await prisma.charVersion.findUnique({ where: { id: versionId } })
  if (!version || version.characterId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Load current character for versioning
  const current = await prisma.character.findUnique({ where: { id } })
  if (!current) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Create a snapshot of the current state before applying restore
  await prisma.charVersion.create({
    data: {
      characterId: id,
      userId: user!.id,
      data: current as any,
    },
  })
  // Update the character with the snapshot data (excluding id/createdAt/updatedAt)
  const { id: _versionId, createdAt: _c, updatedAt: _u, ...snapshotData } = version.data as any
  const updated = await prisma.character.update({
    where: { id },
    data: snapshotData,
  })
  // Record an audit entry for the restore action
  await prisma.auditEntry.create({
    data: {
      userId: user!.id,
      entityType: 'Character',
      entityId: id,
      action: 'UPDATE',
      diff: diffObjects(current, updated),
    },
  })
  // Ensure we cap versions to 100
  const versions = await prisma.charVersion.findMany({
    where: { characterId: id },
    orderBy: { createdAt: 'desc' },
  })
  if (versions.length > 100) {
    const toDelete = versions.slice(100)
    await prisma.charVersion.deleteMany({ where: { id: { in: toDelete.map((v) => v.id) } } })
  }
  const list = versions.slice(0, 100)
  return NextResponse.json({ character: updated, versions: list })
}