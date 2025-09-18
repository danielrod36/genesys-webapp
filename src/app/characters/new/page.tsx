// New character creation page.  Renders a simple form to capture the
// character's name and submits it to `/api/characters`.  Upon successful
// creation, the user is redirected to the newly created character's
// detail page.  Only roles with create permissions (OWNER, GM, PLAYER)
// should access this page.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCharacterPage() {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function createCharacter(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const { id } = await res.json()
      router.push(`/characters/${id}`)
    } else {
      // TODO: show error
      setSaving(false)
    }
  }

  return (
    <main className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">New Character</h1>
      <form onSubmit={createCharacter} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded"
            required
          />
        </label>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {saving ? 'Saving…' : 'Create'}
        </button>
      </form>
    </main>
  )
}