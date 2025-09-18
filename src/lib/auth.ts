import prisma from '@/lib/prisma'
import type { NextRequest } from 'next/server'

/**
 * Extracts the user ID from the request.  It looks for an `x-user-id`
 * header.  If present, it loads the corresponding user from the
 * database.  Returns null if not found or invalid.  This simplified
 * approach stands in for a full authentication system and should be
 * replaced with proper magic‑link or token authentication in production.
 */
export async function getUserFromRequest(req: NextRequest) {
  const id = req.headers.get('x-user-id')
  if (!id) return null
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    return user
  } catch {
    return null
  }
}

export type Permission = 'READ' | 'WRITE' | 'DELETE'

/**
 * Checks whether the given user has permission to perform an action on a
 * resource.  Roles have the following permissions:
 *
 * OWNER: full read/write/delete on all data.
 * GM: read/write/delete on all data except settings.
 * PLAYER: read/write their own character data; read‑only other data.
 * VIEWER: read‑only.
 *
 * @param user The authenticated user (may be null for anonymous)
 * @param resourceOwnerId The ownerId of the resource (e.g. character owner)
 * @param permission The requested action
 */
export function checkPermission(user: any | null, resourceOwnerId: string | null, permission: Permission): boolean {
  if (!user) return false
  switch (user.role) {
    case 'OWNER':
      return true
    case 'GM':
      // Game Masters have full read/write/delete permissions on all data
      return true
    case 'PLAYER':
      if (permission === 'READ') return true
      if (resourceOwnerId && user.id === resourceOwnerId) return true
      return false
    case 'VIEWER':
      return permission === 'READ'
    default:
      return false
  }
}