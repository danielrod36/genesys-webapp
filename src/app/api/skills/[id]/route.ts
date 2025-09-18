// API route for reading, updating and deleting a single skill identified by id.
//
// - GET: Retrieves the skill.  Requires read permission.
// - PUT: Updates the skill with provided values.  Requires write permission and records the diff.
// - DELETE: Removes the skill entirely.  Requires delete permission and logs the previous data.

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
  const skill = await prisma.skill.findUnique({ where: { id: params.id } })
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(skill)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'WRITE')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  const id = params.id
  const body = await req.json()
  const existing = await prisma.skill.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = await prisma.skill.update({ where: { id }, data: body })
  const diff = diffObjects(existing, updated)
  await createAuditEntry({
    userId: user!.id,
    entityType: 'Skill',
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
  const id = params.id
  const existing = await prisma.skill.findUnique({ where: { id } })
  if (existing) {
    await prisma.skill.delete({ where: { id } })
    await createAuditEntry({
      userId: user!.id,
      entityType: 'Skill',
      entityId: id,
      action: 'DELETE',
      diff: existing,
    })
  }
  return NextResponse.json({ ok: true })
}