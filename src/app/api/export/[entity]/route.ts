/**
 * API route for exporting database records as JSON or CSV.  The dynamic
 * segment `[entity]` can be `characters`, `items`, `talents` or `skills`.
 *
 * Authorization: any authenticated user can export data they have read
 * access to.  Players may only export their own characters, while
 * Owners/GMs/Viewers can export everything.  Unsupported entities result
 * in a 400 response.
 *
 * The optional query parameter `format` determines the output format
 * (`json` or `csv`, default is `json`).  For CSV export a simple
 * implementation is used that does not escape commas within values;
 * for production use a proper CSV library is recommended.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest, checkPermission } from '@/lib/auth'

/**
 * Converts an array of objects into a CSV string. It uses the keys of the
 * first object as headers and JSON stringifies values to preserve arrays or
 * nested objects. It does not perform any escaping on commas within values,
 * so for full CSV compliance a dedicated library should be used.
 */
function toCsv(data: any[]): string {
  if (!data || data.length === 0) return ''
  const headers = Object.keys(data[0])
  const lines: string[] = []
  lines.push(headers.join(','))
  for (const row of data) {
    const values = headers.map((h) => {
      const v = (row as any)[h]
      if (v === null || v === undefined) return ''
      if (typeof v === 'object') return JSON.stringify(v)
      return String(v).replace(/\n/g, ' ')
    })
    lines.push(values.join(','))
  }
  return lines.join('\n')
}

export async function GET(req: NextRequest, { params }: { params: { entity: string } }) {
  // Authorization: at least read permission; players only export their own characters
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, null, 'READ')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const { entity } = params
  const format = req.nextUrl.searchParams.get('format') ?? 'json'
  let data: any[] = []
  try {
    switch (entity) {
      case 'characters':
        if (user!.role === 'PLAYER') {
          // players can only export their own characters
          data = await prisma.character.findMany({ where: { ownerId: user!.id } })
        } else {
          data = await prisma.character.findMany()
        }
        break
      case 'items':
        data = await prisma.item.findMany()
        break
      case 'talents':
        data = await prisma.talent.findMany()
        break
      case 'skills':
        data = await prisma.skill.findMany()
        break
      default:
        return new Response('Unsupported entity', { status: 400 })
    }
  } catch (err) {
    console.error('Export error', err)
    return new Response('Database error', { status: 500 })
  }
  if (format === 'csv') {
    const csv = toCsv(data)
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${entity}.csv"`,
      },
    })
  } else {
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${entity}.json"`,
      },
    })
  }
}