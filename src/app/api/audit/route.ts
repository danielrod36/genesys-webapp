import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/audit
 *
 * Returns the most recent audit entries.  Optionally accepts a query
 * parameter `entityType` to filter by entity type.  Results are ordered
 * from newest to oldest.  Only a limited number of entries (default 100)
 * are returned to prevent unbounded responses.
 */
export async function GET(req: NextRequest) {
  const entityType = req.nextUrl.searchParams.get('entityType') || undefined
  const take = parseInt(req.nextUrl.searchParams.get('limit') || '100', 10)
  try {
    const where = entityType ? { entityType } : {}
    const entries = await prisma.auditEntry.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: isNaN(take) || take <= 0 ? 100 : take,
    })
    return new Response(JSON.stringify(entries), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error fetching audit entries', err)
    return new Response('Server error', { status: 500 })
  }
}