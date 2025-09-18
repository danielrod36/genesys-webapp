'use client'
// Client page for creating a new talent.  Provides a form capturing
// the Talent's name, tier, activation type, whether it is ranked, and a
// description.  On submission the data is sent to `/api/talents` and,
// upon success, the user is redirected to the talents list.  Only users
// with write permissions (OWNER or GM) should access this page.
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTalentPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', tier: 1, activation: '', ranked: false, description: '' })
  const [saving, setSaving] = useState(false)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/talents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      router.push('/talents')
    } else {
      setSaving(false)
    }
  }
  return (
    <main className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">New Talent</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="font-semibold">Name</span>
          <input type="text" className="border p-2 rounded" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="flex flex-col">
          <span className="font-semibold">Tier</span>
          <input type="number" className="border p-2 rounded" value={form.tier} onChange={(e) => setForm({ ...form, tier: parseInt(e.target.value) })} />
        </label>
        <label className="flex flex-col">
          <span className="font-semibold">Activation</span>
          <input type="text" className="border p-2 rounded" value={form.activation} onChange={(e) => setForm({ ...form, activation: e.target.value })} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.ranked} onChange={(e) => setForm({ ...form, ranked: e.target.checked })} />
          <span className="font-semibold">Ranked</span>
        </label>
        <label className="flex flex-col">
          <span className="font-semibold">Description</span>
          <textarea className="border p-2 rounded" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{saving ? 'Saving…' : 'Create'}</button>
      </form>
    </main>
  )
}