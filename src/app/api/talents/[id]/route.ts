// API route for reading, updating and deleting a single talent by id.
//
// - GET: Returns a single talent.  All authenticated users may read talents.
// - PUT: Updates a talent.  Requires WRITE permission.  Records a diff in the audit log.
// - DELETE: Deletes a talent.  Requires DELETE permission.  Logs the entire record before deletion.

import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { createAuditEntry, diffObjects } from '@/lib/audit'
import { getUserFromRequest, checkPermission } from '@/lib/auth'

interface Params {
  params: { id: string }
}

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'READ')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const { id } = params
  const talent = await prisma.talent.findUnique({ where: { id } })
  if (!talent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(talent)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'WRITE')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  const { id } = params
  const body = await req.json()
  const existing = await prisma.talent.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = await prisma.talent.update({ where: { id }, data: body })
  const diff = diffObjects(existing, updated)
  await createAuditEntry({
    userId: user!.id,
    entityType: 'Talent',
    entityId: id,
    action: 'UPDATE',
    diff,
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'DELETE')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  const { id } = params
  const existing = await prisma.talent.findUnique({ where: { id } })
  if (existing) {
    await prisma.talent.delete({ where: { id } })
    await createAuditEntry({
      userId: user!.id,
      entityType: 'Talent',
      entityId: id,
      action: 'DELETE',
      diff: existing,
    })
  }
  return NextResponse.json({ ok: true })
}