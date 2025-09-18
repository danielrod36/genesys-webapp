/**
 * API route for operations on a single character by ID.  Supports:
 *
 * - GET: Retrieve the character along with up to the last 100 version
 *   snapshots.  Players can only view their own characters; Owners, GMs and
 *   Viewers can view any character.  Returns 404 if the character does not exist.
 * - PUT: Update fields on the character.  Allowed for Owners or GMs on any
 *   character and for Players on characters they own.  The old state is
 *   captured into a version snapshot and an audit entry is recorded.  If
 *   more than 100 versions exist after the update, old versions are pruned.
 * - DELETE: Remove the character and all related records.  Only Owners or
 *   GMs may delete characters.  Deletes associated items, skills, talents,
 *   XP grants, versions, and notes before removing the character itself.
 */
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createAuditEntry, diffObjects } from '@/lib/audit'
import { getUserFromRequest, checkPermission } from '@/lib/auth'

interface Params {
  params: { id: string }
}

// GET /api/characters/[id]
export async function GET(req: Request, { params }: Params) {
  const { id } = params
  try {
    const character = await prisma.character.findUnique({
      where: { id },
    })
    if (!character) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    // Authorization: players can only view their own character
    const userId = req.headers.get('x-user-id') || null
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user && user.role === 'PLAYER' && character.ownerId !== user.id) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }
    }
    const versions = await prisma.charVersion.findMany({
      where: { characterId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ character, versions })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT /api/characters/[id]
export async function PUT(req: Request, { params }: Params) {
  const { id } = params
  try {
    const update = await req.json()
    const existing = await prisma.character.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const userId = req.headers.get('x-user-id') || null
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }
    // Permission: Owner or GM can update any; Player only their own; Viewer cannot
    if (user.role === 'VIEWER' || (user.role === 'PLAYER' && existing.ownerId !== user.id)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }
    const updated = await prisma.character.update({
      where: { id },
      data: update,
    })
    const difference = diffObjects(existing, updated)
    await createAuditEntry({
      userId: user.id,
      entityType: 'Character',
      entityId: id,
      action: 'UPDATE',
      diff: difference,
    })
    await prisma.charVersion.create({
      data: {
        characterId: id,
        userId: user.id,
        data: existing as any,
      },
    })
    // Trim to last 100 versions
    const versions = await prisma.charVersion.findMany({
      where: { characterId: id },
      orderBy: { createdAt: 'desc' },
    })
    if (versions.length > 100) {
      const toDelete = versions.slice(100)
      await prisma.charVersion.deleteMany({
        where: { id: { in: toDelete.map((v) => v.id) } },
      })
    }
    const newVersions = versions.slice(0, 100)
    return NextResponse.json({ character: updated, versions: newVersions })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/characters/[id]
export async function DELETE(req: Request, { params }: Params) {
  const { id } = params
  try {
    const existing = await prisma.character.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const userId = req.headers.get('x-user-id') || null
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }
    // Only OWNER or GM can delete
    if (user.role !== 'OWNER' && user.role !== 'GM') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }
    // Delete related records
    await prisma.charItem.deleteMany({ where: { characterId: id } })
    await prisma.charSkill.deleteMany({ where: { characterId: id } })
    await prisma.charTalent.deleteMany({ where: { characterId: id } })
    await prisma.xPGrant.deleteMany({ where: { characterId: id } })
    await prisma.charVersion.deleteMany({ where: { characterId: id } })
    await prisma.note.deleteMany({ where: { characterId: id } })
    await prisma.character.delete({ where: { id } })
    await createAuditEntry({
      userId: user.id,
      entityType: 'Character',
      entityId: id,
      action: 'DELETE',
      diff: existing,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}