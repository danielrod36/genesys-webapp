// API route for listing and creating talent entities.
//
// - GET: Returns a list of all talents.  Any authenticated user may read talents.
// - POST: Creates a new talent with the provided fields (name, tier, activation, ranked, description).  Only
//         users with WRITE permission may create talents.  After creation an audit entry is recorded.

import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { getUserFromRequest, checkPermission } from '@/lib/auth'

// GET /api/talents
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'READ')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const talents = await prisma.talent.findMany({
    select: {
      id: true,
      name: true,
      tier: true,
      activation: true,
      ranked: true,
      description: true,
    },
    orderBy: { tier: 'asc' },
  })
  return NextResponse.json(talents)
}

// POST /api/talents
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'WRITE')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  const body = await req.json()
  const { name, tier, activation, ranked, description, prerequisites } = body
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const talent = await prisma.talent.create({
    data: {
      name,
      tier: tier ?? 1,
      activation: activation ?? '',
      ranked: ranked ?? false,
      description: description ?? '',
      prerequisites: prerequisites ?? {},
    },
  })
  await createAuditEntry({
    userId: user!.id,
    entityType: 'Talent',
    entityId: talent.id,
    action: 'CREATE',
    diff: { name: { before: null, after: name } },
  })
  return NextResponse.json({ id: talent.id })
}