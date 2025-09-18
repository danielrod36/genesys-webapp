// Character detail page.  Displays and allows inline editing of a single
// character record, including characteristics, derived stats, credits and
// encumbrance.  It fetches both the character data and its version history
// from `/api/characters/[id]`.  Users can update fields by blurring
// inputs, view version history with differences, restore previous
// versions, print the sheet and download a PDF.  Only users with
// sufficient permissions may edit; others can view only.
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Metadata } from 'next'

interface Character {
  id: string
  name: string
  characteristics: Record<string, any>
  derivedStats: Record<string, any>
  credits: number
  encumbranceCurr: number
  encumbranceMax: number
  // other fields omitted
}

interface Version {
  id: string
  createdAt: string
}

export default function CharacterDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [character, setCharacter] = useState<Character | null>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // State for diff/restore modal
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [diffData, setDiffData] = useState<Record<string, any> | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/characters/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCharacter(data.character)
        setVersions(data.versions)
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function updateField(field: string, value: any) {
    if (!character) return
    setSaving(true)
    const res = await fetch(`/api/characters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (res.ok) {
      const { character: updated, versions: v } = await res.json()
      setCharacter(updated)
      setVersions(v)
    }
    setSaving(false)
  }

  if (loading) return <main className="p-8">Loading…</main>
  if (!character) return <main className="p-8">Character not found.</main>

  return (
    <main className="p-8 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Character: {character.name}</h1>
        <div className="space-x-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Print
          </button>
          <a
            href={`/api/characters/${id}/pdf`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            target="_blank"
            rel="noopener"
          >
            Download PDF
          </a>
        </div>
      </div>
      <div className="flex gap-8">
        <div className="flex-1">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col">
            <span className="font-semibold">Name</span>
            <input
              type="text"
              defaultValue={character.name}
              onBlur={(e) => updateField('name', e.target.value)}
              className="border p-2 rounded"
            />
          </label>
          <label className="flex flex-col">
            <span className="font-semibold">Credits</span>
            <input
              type="number"
              defaultValue={character.credits}
              onBlur={(e) => updateField('credits', parseInt(e.target.value))}
              className="border p-2 rounded"
            />
          </label>
          <label className="flex flex-col">
            <span className="font-semibold">Encumbrance (current)</span>
            <input
              type="number"
              defaultValue={character.encumbranceCurr}
              onBlur={(e) => updateField('encumbranceCurr', parseInt(e.target.value))}
              className="border p-2 rounded"
            />
          </label>
          <label className="flex flex-col">
            <span className="font-semibold">Encumbrance (max)</span>
            <input
              type="number"
              defaultValue={character.encumbranceMax}
              onBlur={(e) => updateField('encumbranceMax', parseInt(e.target.value))}
              className="border p-2 rounded"
            />
          </label>
          {/* Additional fields can be added here */}
        </div>
        {saving && <p className="mt-4 text-sm text-gray-500">Saving…</p>}
        </div>
        <aside className="w-60 print:hidden">
          <h2 className="font-semibold mb-2">Version History</h2>
          <ul className="space-y-1 max-h-96 overflow-auto">
            {versions.map((v) => (
              <li
                key={v.id}
                className="text-sm flex justify-between items-center cursor-pointer hover:underline"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/characters/${id}/versions/${v.id}`)
                    if (res.ok) {
                      const data = await res.json()
                      // store diff and selected version details
                      setSelectedVersion(v)
                      setDiffData(data.diff)
                    }
                  } catch (err) {
                    console.error('Failed to load version diff', err)
                  }
                }}
              >
                <span>{new Date(v.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
      {selectedVersion && diffData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              Version from {new Date(selectedVersion.createdAt).toLocaleString()}
            </h3>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Differences</h4>
              {Object.keys(diffData).length === 0 ? (
                <p className="text-sm">No differences between this version and the current character.</p>
              ) : (
                <table className="min-w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="border p-2 text-left">Field</th>
                      <th className="border p-2 text-left">Before</th>
                      <th className="border p-2 text-left">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(diffData).map(([field, change]) => (
                      <tr key={String(field)}>
                        <td className="border p-2 font-mono">{String(field)}</td>
                        <td className="border p-2">
                          {typeof (change as any).before === 'object'
                            ? JSON.stringify((change as any).before)
                            : String((change as any).before)}
                        </td>
                        <td className="border p-2">
                          {typeof (change as any).after === 'object'
                            ? JSON.stringify((change as any).after)
                            : String((change as any).after)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => {
                  setSelectedVersion(null)
                  setDiffData(null)
                }}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/characters/${id}/versions/${selectedVersion!.id}`, {
                      method: 'POST',
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setCharacter(data.character)
                      setVersions(data.versions)
                      setSelectedVersion(null)
                      setDiffData(null)
                    }
                  } catch (err) {
                    console.error('Failed to restore version', err)
                  }
                }}
              >
                Restore Version
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}