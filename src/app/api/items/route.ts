// API route for listing all items and creating new items.
//
// - GET: Returns a list of all items in the database that the current user has permission to view.  Uses
//        `getUserFromRequest` and `checkPermission` to enforce read access.
// - POST: Creates a new item with the provided fields (name, type, rarity, encumbrance, price, description).
//         Only users with WRITE permission (OWNER/GM) can create items.  After creation, an audit entry is
//         recorded with the diff showing the new item name.

import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { getUserFromRequest, checkPermission } from '@/lib/auth'

// GET /api/items
export async function GET(req: NextRequest) {
  // Authorize: all roles may read items
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'READ')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const items = await prisma.item.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      rarity: true,
      encumbrance: true,
      price: true,
      description: true,
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(items)
}

// POST /api/items
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'WRITE')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  const body = await req.json()
  const { name, type, rarity, encumbrance, price, description } = body
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const item = await prisma.item.create({
    data: {
      name,
      type,
      rarity: rarity ?? 0,
      encumbrance: encumbrance ?? 0,
      price: price ?? 0,
      description: description ?? '',
    },
  })
  await createAuditEntry({
    userId: user!.id,
    entityType: 'Item',
    entityId: item.id,
    action: 'CREATE',
    diff: { name: { before: null, after: name } },
  })
  return NextResponse.json({ id: item.id })
}