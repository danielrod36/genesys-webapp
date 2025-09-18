'use client'
// Client page for creating a new item.  Presents a form with fields
// matching the Item model (name, type, rarity, encumbrance, price,
// description).  When submitted, it POSTs to `/api/items` and upon
// success navigates back to the Items list.  Only users with edit
// permissions should access this page; navigation should be protected in
// the UI layer.
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewItemPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', type: 'OTHER', rarity: 0, encumbrance: 0, price: 0, description: '' })
  const [saving, setSaving] = useState(false)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      router.push('/items')
    } else {
      setSaving(false)
    }
  }
  return (
    <main className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">New Item</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="font-semibold">Name</span>
          <input type="text" className="border p-2 rounded" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="flex flex-col">
          <span className="font-semibold">Type</span>
          <select className="border p-2 rounded" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="WEAPON">Weapon</option>
            <option value="ARMOR">Armor</option>
            <option value="ATTACHMENT">Attachment</option>
            <option value="GEAR">Gear</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="flex flex-col">
          <span className="font-semibold">Rarity</span>
          <input type="number" className="border p-2 rounded" value={form.rarity} onChange={(e) => setForm({ ...form, rarity: parseInt(e.target.value) })} />
        </label>
        <label className="flex flex-col">
          <span className="font-semibold">Encumbrance</span>
          <input type="number" className="border p-2 rounded" value={form.encumbrance} onChange={(e) => setForm({ ...form, encumbrance: parseInt(e.target.value) })} />
        </label>
        <label className="flex flex-col">
          <span className="font-semibold">Price</span>
          <input type="number" className="border p-2 rounded" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })} />
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