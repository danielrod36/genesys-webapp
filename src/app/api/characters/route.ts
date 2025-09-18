// API route for listing all characters and creating a new character.
//
// - GET: Returns a filtered list of characters based on the current user's role.  Players see only
//        their own characters; all other roles see all characters.  Unauthenticated users see none.
// - POST: Creates a new character owned by the authenticated user (OWNER/GM/PLAYER roles only).  A
//         minimal character record is created and an audit entry is recorded.  Returns the new id.

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { getUserFromRequest, checkPermission } from '@/lib/auth'

// GET /api/characters
export async function GET(req: Request) {
  // Authenticate the user
  const userId = req.headers.get('x-user-id') || null
  let characters
  if (!userId) {
    // Unauthenticated users see nothing
    characters = []
  } else {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      characters = []
    } else if (user.role === 'PLAYER') {
      // Players only see their own characters
      characters = await prisma.character.findMany({
        where: { ownerId: user.id },
        select: {
          id: true,
          name: true,
          speciesId: true,
          careerId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Owner/GM/Viewer see all characters
      characters = await prisma.character.findMany({
        select: {
          id: true,
          name: true,
          speciesId: true,
          careerId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }
  }
  return NextResponse.json(characters)
}

// POST /api/characters
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name } = body
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    // Authenticate
    const userId = req.headers.get('x-user-id') || null
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }
    // Only OWNER or GM or PLAYER may create characters (PLAYER becomes owner of their own character)
    if (user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }
    const character = await prisma.character.create({
      data: {
        name,
        ownerId: user.id,
        characteristics: {},
        derivedStats: {},
        credits: 0,
        encumbranceCurr: 0,
        encumbranceMax: 0,
      },
    })
    await createAuditEntry({
      userId: user.id,
      entityType: 'Character',
      entityId: character.id,
      action: 'CREATE',
      diff: { name: { before: null, after: name } },
    })
    return NextResponse.json({ id: character.id })
  } catch (e) {
    return NextResponse.json({ error: 'Unable to create character' }, { status: 500 })
  }
}