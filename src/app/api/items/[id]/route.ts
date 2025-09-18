// API route for fetching, updating and deleting a single item identified by its ID.
//
// - GET: Returns the item with the given id or a 404 if not found.  All authenticated users may read items.
// - PUT: Updates the item's fields.  Only users with WRITE permission may perform this action.  The diff between
//        the existing and updated item is recorded in the audit log.
// - DELETE: Removes the item entirely.  Only users with DELETE permission may perform this action.  The deleted
//           item's data is stored in the audit log for reference.

import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { createAuditEntry, diffObjects } from '@/lib/audit'
import { getUserFromRequest, checkPermission } from '@/lib/auth'

interface Params {
  params: { id: string }
}

// GET /api/items/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'READ')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const { id } = params
  const item = await prisma.item.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

// PUT /api/items/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'WRITE')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  const { id } = params
  const body = await req.json()
  const existing = await prisma.item.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = await prisma.item.update({ where: { id }, data: body })
  const difference = diffObjects(existing, updated)
  await createAuditEntry({
    userId: user!.id,
    entityType: 'Item',
    entityId: id,
    action: 'UPDATE',
    diff: difference,
  })
  return NextResponse.json(updated)
}

// DELETE /api/items/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'DELETE')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  const { id } = params
  const existing = await prisma.item.findUnique({ where: { id } })
  if (existing) {
    await prisma.item.delete({ where: { id } })
    await createAuditEntry({
      userId: user!.id,
      entityType: 'Item',
      entityId: id,
      action: 'DELETE',
      diff: existing,
    })
  }
  return NextResponse.json({ ok: true })
}