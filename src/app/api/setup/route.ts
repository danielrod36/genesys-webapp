import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma'

/**
 * Setup API handler.  Provides two capabilities:
 *
 * - GET `/api/setup`: Returns a JSON object describing which initial
 *   resources are missing.  Currently checks whether a Genesys dice
 *   font file has been uploaded (expected under `public/fonts`) and
 *   whether SMTP configuration exists in the settings table.  If
 *   `smtpHost` or `smtpUser` is undefined, `smtpMissing` will be true.
 *
 * - POST `/api/setup`: Accepts a multipart form containing a `fontFile`
 *   field.  Saves the provided font file into the `public/fonts`
 *   directory as `genesys-dice.ttf` (preserving original extension) and
 *   returns `{ ok: true }`.  If no file is provided or an error
 *   occurs, returns an error response.  Only authenticated users
 *   should call this endpoint; however this simple implementation does
 *   not enforce auth and relies on front‑end routing.
 */
export async function GET() {
  // Check for dice font presence
  const fontDir = path.join(process.cwd(), 'public', 'fonts')
  let fontsMissing = true
  try {
    const files = await fs.readdir(fontDir)
    // Consider a dice font present if any file exists in the fonts folder
    fontsMissing = files.length === 0
  } catch {
    fontsMissing = true
  }
  // Check for SMTP settings
  let smtpMissing = true
  try {
    // Always use ownerId from DEFAULT_OWNER_ID env var
    const ownerId = process.env.DEFAULT_OWNER_ID ?? '00000000-0000-0000-0000-000000000000'
    const setting = await prisma.setting.findFirst({ where: { ownerId } })
    smtpMissing = !setting || !setting.smtpHost || !setting.smtpUser
  } catch {
    smtpMissing = true
  }
  return NextResponse.json({ fontsMissing, smtpMissing })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('fontFile')
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No font file provided' }, { status: 400 })
    }
    // Determine file extension from uploaded filename if available
    const originalName = (file as any).name || 'genesys-dice.ttf'
    const ext = originalName.split('.').pop() || 'ttf'
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    // Ensure fonts directory exists
    const fontDir = path.join(process.cwd(), 'public', 'fonts')
    await fs.mkdir(fontDir, { recursive: true })
    const targetPath = path.join(fontDir, `genesys-dice.${ext}`)
    await fs.writeFile(targetPath, buffer)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Error in setup POST', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}