import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { getUserFromRequest, checkPermission } from '@/lib/auth'

/**
 * API endpoint for importing data from CSV/JSON into the database. The request
 * body should include the target entity (characters, items, talents or
 * skills), a mapping from internal field names to incoming column names, and
 * the array of records as parsed by the client. This implementation is
 * intentionally minimal: it supports characters only and treats all fields
 * as optional strings. It should be extended to validate and transform
 * values properly and to support other entities.
 */
export async function POST(req: NextRequest) {
  // Authorization: only OWNER or GM may import data
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'WRITE')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  const { entity, mapping, records } = await req.json()
  if (!entity || !mapping || !records) {
    return new Response('Invalid payload', { status: 400 })
  }
  if (entity !== 'characters') {
    return new Response('Unsupported entity', { status: 400 })
  }
  const created: any[] = []
  for (const record of records as any[]) {
    // Build data object for Prisma. Only include known fields; skip empty
    const data: any = {}
    for (const field in mapping) {
      const column = mapping[field]
      if (column) {
        data[field] = record[column]
      }
    }
    // parse JSON fields if provided
    if (data.json_characteristics && typeof data.json_characteristics === 'string') {
      try { data.json_characteristics = JSON.parse(data.json_characteristics) } catch {}
    }
    if (data.json_derived && typeof data.json_derived === 'string') {
      try { data.json_derived = JSON.parse(data.json_derived) } catch {}
    }
    if (data.obligation_json && typeof data.obligation_json === 'string') {
      try { data.obligation_json = JSON.parse(data.obligation_json) } catch {}
    }
    if (data.duty_json && typeof data.duty_json === 'string') {
      try { data.duty_json = JSON.parse(data.duty_json) } catch {}
    }
    if (data.morality_json && typeof data.morality_json === 'string') {
      try { data.morality_json = JSON.parse(data.morality_json) } catch {}
    }
    if (data.custom_json && typeof data.custom_json === 'string') {
      try { data.custom_json = JSON.parse(data.custom_json) } catch {}
    }
    // Provide fallback owner for characters imported: assign to importer
    data.ownerId = user!.id
    try {
      const char = await prisma.character.create({ data })
      // Record audit entry for import with actual user
      await createAuditEntry({
        userId: user!.id,
        entityType: 'Character',
        entityId: char.id,
        action: 'CREATE',
        diff: char,
      })
      created.push(char)
    } catch (err: any) {
      console.error('Failed to create character', err)
    }
  }
  return new Response(JSON.stringify({ createdCount: created.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}