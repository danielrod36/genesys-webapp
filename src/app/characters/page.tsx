// Characters list page.  Loads all characters visible to the current user
// by calling `/api/characters` on mount and displays them in a table.
// Players see only their own characters; other roles see all.  Provides
// a link to create a new character and links each row to the detail page
// for editing.
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CharacterDto {
  id: string
  name: string
  speciesId?: string | null
  careerId?: string | null
  createdAt: string
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<CharacterDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/characters')
      if (res.ok) {
        const data = await res.json()
        setCharacters(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Characters</h1>
      <div className="mb-4">
        <Link href="/characters/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Character</Link>
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Species</th>
              <th className="border p-2 text-left">Career</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {characters.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border p-2">
                  <Link href={`/characters/${c.id}`} className="text-blue-600 underline">{c.name}</Link>
                </td>
                <td className="border p-2">{c.speciesId ?? '-'}</td>
                <td className="border p-2">{c.careerId ?? '-'}</td>
                <td className="border p-2 text-center">
                  <Link href={`/characters/${c.id}`} className="text-blue-600 underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}