// API route for listing and creating skills.
//
// - GET: Returns all skills.  Any authenticated user may read skills.
// - POST: Creates a new skill.  Only users with WRITE permission may create skills.  Records an audit entry.

import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { getUserFromRequest, checkPermission } from '@/lib/auth'

// GET /api/skills
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'READ')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const skills = await prisma.skill.findMany({
    select: {
      id: true,
      name: true,
      characteristic: true,
      isCareerDefault: true,
      description: true,
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(skills)
}

// POST /api/skills
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'WRITE')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  const body = await req.json()
  const { name, characteristic, isCareerDefault, description } = body
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const skill = await prisma.skill.create({
    data: {
      name,
      characteristic: characteristic ?? 'BRAWN',
      isCareerDefault: isCareerDefault ?? false,
      description: description ?? '',
    },
  })
  await createAuditEntry({
    userId: user!.id,
    entityType: 'Skill',
    entityId: skill.id,
    action: 'CREATE',
    diff: { name: { before: null, after: name } },
  })
  return NextResponse.json({ id: skill.id })
}