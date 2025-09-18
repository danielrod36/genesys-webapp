import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/auth/login
 *
 * A very simplistic login endpoint.  It accepts a JSON body with an
 * `email` field.  If a user with that email exists, it returns the
 * existing user.  Otherwise it creates a new user.  The first user
 * created in the system is assigned the OWNER role; subsequent users
 * are assigned the PLAYER role by default.  A proper production system
 * would send a magic link email; here we simply return the user ID so
 * that the client can include it in subsequent requests via the
 * `X-User-Id` header.
 */
export async function POST(req: NextRequest) {
  const { email, name } = await req.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ id: existing.id, role: existing.role, email: existing.email, name: existing.name })
  }
  // Determine role: first user is OWNER, next is PLAYER
  const count = await prisma.user.count()
  const role = count === 0 ? 'OWNER' : 'PLAYER'
  const user = await prisma.user.create({
    data: {
      email,
      name: name ?? '',
      role,
    },
  })
  return NextResponse.json({ id: user.id, role: user.role, email: user.email, name: user.name })
}