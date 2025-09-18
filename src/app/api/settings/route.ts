
/**
 * API route for reading and updating application settings.  There is a single
 * settings document per installation keyed off of `ownerId` (from
 * `DEFAULT_OWNER_ID` env var).  The GET handler returns the current
 * settings, creating a default record if none exist.  The PUT handler
 * updates the settings with the values provided in the request body and
 * returns the updated record.  Settings include system toggles (Obligation,
 * Duty, Morality), domain toggles (enable/disable various data domains),
 * SMTP configuration, backup policies, and UI preferences (theme and locale).
 */
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/settings
export async function GET() {
  const ownerId = process.env.DEFAULT_OWNER_ID ?? '00000000-0000-0000-0000-000000000000'
  let setting = await prisma.setting.findFirst({ where: { ownerId } })
  if (!setting) {
    setting = await prisma.setting.create({
      data: {
        ownerId,
        systemToggles: { obligation: false, duty: false, morality: false },
        domainToggles: {
          items: true,
          weapons: true,
          armor: true,
          attachments: true,
          talents: true,
          skills: true,
          careers: true,
          species: true,
          adversaries: true,
          qualities: true,
          criticalInjuries: true,
          tags: true,
          encounters: true,
          sessions: true,
          xp: true,
        },
        theme: 'light',
        locale: 'en',
      },
    })
  }
  return NextResponse.json(setting)
}

// PUT /api/settings
export async function PUT(req: Request) {
  const ownerId = process.env.DEFAULT_OWNER_ID ?? '00000000-0000-0000-0000-000000000000'
  const body = await req.json()
  let setting = await prisma.setting.findFirst({ where: { ownerId } })
  if (!setting) {
    setting = await prisma.setting.create({
      data: {
        ownerId,
        systemToggles: {},
        domainToggles: {},
      },
    })
  }
  const updated = await prisma.setting.update({
    where: { id: setting.id },
    data: body,
  })
  return NextResponse.json(updated)
}