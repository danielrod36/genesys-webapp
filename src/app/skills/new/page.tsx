'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// New skill creation page. Uses simple client-side state to capture form fields
// and posts to the server via the REST API. On success it redirects back to
// the skills list. The fields mirror the Prisma Skill model: name,
// characteristic, isCareerDefault and description. Characteristic is
// enumerated according to the Genesys characteristics.
export default function NewSkillPage() {
  const router = useRouter()
  // Form state with sensible defaults
  const [form, setForm] = useState({
    name: '',
    characteristic: 'BRAWN',
    isCareerDefault: false,
    description: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      // Navigate back to skills page after successful creation
      router.push('/skills')
    } else {
      // If the server rejects, re-enable the form for correction
      setSaving(false)
    }
  }

  return (
    <main className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">New Skill</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="font-semibold">Name</span>
          <input
            type="text"
            className="border p-2 rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label className="flex flex-col">
          <span className="font-semibold">Characteristic</span>
          <select
            className="border p-2 rounded"
            value={form.characteristic}
            onChange={(e) => setForm({ ...form, characteristic: e.target.value })}
          >
            <option value="BRAWN">Brawn</option>
            <option value="AGILITY">Agility</option>
            <option value="INTELLECT">Intellect</option>
            <option value="CUNNING">Cunning</option>
            <option value="WILLPOWER">Willpower</option>
            <option value="PRESENCE">Presence</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isCareerDefault}
            onChange={(e) => setForm({ ...form, isCareerDefault: e.target.checked })}
          />
          <span className="font-semibold">Career Default</span>
        </label>
        <label className="flex flex-col">
          <span className="font-semibold">Description</span>
          <textarea
            className="border p-2 rounded"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {saving ? 'Saving…' : 'Create'}
        </button>
      </form>
    </main>
  )
}