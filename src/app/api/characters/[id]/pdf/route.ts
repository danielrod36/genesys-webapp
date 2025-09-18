import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest, checkPermission } from '@/lib/auth'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

/**
 * GET /api/characters/[id]/pdf
 *
 * Generates a PDF representation of a character sheet using @react-pdf/renderer.
 * The caller must have read access to the character.  The response contains
 * a binary PDF document with appropriate headers for download.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  // Authenticate and authorize
  const user = await getUserFromRequest(req)
  if (!checkPermission(user, id, 'READ')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  // Load character
  const character = await prisma.character.findUnique({ where: { id } })
  if (!character) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Build a PDF document
  const styles = StyleSheet.create({
    page: { padding: 24, fontSize: 12 },
    heading: { fontSize: 20, marginBottom: 12 },
    section: { marginBottom: 12 },
    label: { fontWeight: 'bold' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  })
  const MyDoc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>{character.name}</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Credits: </Text>
          <Text>{character.credits ?? 0}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Encumbrance:</Text>
          <Text>
            {character.encumbranceCurr ?? 0} / {character.encumbranceMax ?? 0}
          </Text>
        </View>
        {/* Characteristics */}
        <View style={styles.section}>
          <Text style={styles.label}>Characteristics</Text>
          {character.characteristics &&
            Object.entries(character.characteristics).map(([key, value]) => (
              <View style={styles.row} key={key}>
                <Text>{key}</Text>
                <Text>{String(value)}</Text>
              </View>
            ))}
        </View>
        {/* Derived stats */}
        <View style={styles.section}>
          <Text style={styles.label}>Derived Stats</Text>
          {character.derivedStats &&
            Object.entries(character.derivedStats).map(([key, value]) => (
              <View style={styles.row} key={key}>
                <Text>{key}</Text>
                <Text>{String(value)}</Text>
              </View>
            ))}
        </View>
      </Page>
    </Document>
  )
  const doc = pdf(MyDoc)
  const buffer = await doc.toBuffer()
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="character-${character.name}.pdf"`,
    },
  })
}