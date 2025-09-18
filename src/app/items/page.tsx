// This client‑side page lists all items and provides inline editing,
// search, filtering and saved views.  It fetches data from the server via
// the `/api/items` endpoint on load.  Users with OWNER or GM roles can
// create, edit or delete items, while Players and Viewers can only read
// them.  Filters allow users to narrow items by name, type and rarity.
// Saved filter views are persisted in localStorage and can be recalled
// later.  A link to add a new item is shown only to users with edit
// privileges.
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ItemDto {
  id: string
  name: string
  type: string
  rarity: number
  encumbrance: number
  price: number
  description: string
}

export default function ItemsPage() {
  const [items, setItems] = useState<ItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<Partial<ItemDto>>({})
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [rarityFilter, setRarityFilter] = useState('')
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: any }[]>([])
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/items')
      if (res.ok) setItems(await res.json())
      setLoading(false)
    }
    load()
    // load saved filters from localStorage
    const saved = localStorage.getItem('itemSavedFilters')
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved))
      } catch {}
    }
    // determine edit permissions from userRole in localStorage
    const role = localStorage.getItem('userRole')
    setCanEdit(role === 'OWNER' || role === 'GM')
  }, [])

  function startEdit(item: ItemDto) {
    if (!canEdit) return
    setEditingId(item.id)
    setEditItem(item)
  }

  async function saveEdit() {
    if (!editingId) return
    await fetch(`/api/items/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editItem),
    })
    setItems((items) => items.map((it) => (it.id === editingId ? { ...it, ...editItem } as ItemDto : it)))
    setEditingId(null)
    setEditItem({})
  }

  async function deleteItem(id: string) {
    if (!canEdit) return
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    setItems((items) => items.filter((it) => it.id !== id))
  }

  function saveCurrentFilter() {
    const name = prompt('Name for this view:')
    if (!name) return
    const newSaved = [...savedFilters, { name, filters: { search, typeFilter, rarityFilter } }]
    setSavedFilters(newSaved)
    localStorage.setItem('itemSavedFilters', JSON.stringify(newSaved))
  }

  function applySaved(index: number) {
    const s = savedFilters[index]
    if (!s) return
    setSearch(s.filters.search || '')
    setTypeFilter(s.filters.typeFilter || '')
    setRarityFilter(s.filters.rarityFilter || '')
  }

  function deleteSaved(index: number) {
    const newSaved = savedFilters.filter((_, i) => i !== index)
    setSavedFilters(newSaved)
    localStorage.setItem('itemSavedFilters', JSON.stringify(newSaved))
  }

  if (loading) return <main className="p-8">Loading…</main>

  const uniqueTypes = Array.from(new Set(items.map((it) => it.type))).filter(Boolean)
  const filtered = items
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => (typeFilter ? item.type === typeFilter : true))
    .filter((item) => (rarityFilter ? String(item.rarity) === rarityFilter : true))

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Items</h1>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded w-full sm:max-w-xs"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border p-2 rounded w-full sm:max-w-xs"
          >
            <option value="">All types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            className="border p-2 rounded w-full sm:max-w-xs"
          >
            <option value="">Any rarity</option>
            {[...new Set(items.map((it) => it.rarity))].map((r) => (
              <option key={r} value={String(r)}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link href="/items/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add Item
            </Link>
          )}
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <button onClick={saveCurrentFilter} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
          Save current filters
        </button>
        {savedFilters.map((sf, idx) => (
          <span key={idx} className="flex items-center space-x-1 bg-gray-100 border px-2 py-1 rounded">
            <button onClick={() => applySaved(idx)} className="text-blue-600 underline">
              {sf.name}
            </button>
            <button onClick={() => deleteSaved(idx)} className="text-red-500 ml-1">
              ×
            </button>
          </span>
        ))}
      </div>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Type</th>
            <th className="border p-2 text-left">Rarity</th>
            <th className="border p-2 text-left">Encum.</th>
            <th className="border p-2 text-left">Price</th>
            <th className="border p-2 text-left">Description</th>
            {canEdit && <th className="border p-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              {editingId === item.id ? (
                <>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={editItem.name ?? ''}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                      className="border p-1 rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={editItem.type ?? ''}
                      onChange={(e) => setEditItem({ ...editItem, type: e.target.value })}
                      className="border p-1 rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={editItem.rarity ?? 0}
                      onChange={(e) => setEditItem({ ...editItem, rarity: parseInt(e.target.value) })}
                      className="border p-1 rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={editItem.encumbrance ?? 0}
                      onChange={(e) => setEditItem({ ...editItem, encumbrance: parseInt(e.target.value) })}
                      className="border p-1 rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={editItem.price ?? 0}
                      onChange={(e) => setEditItem({ ...editItem, price: parseInt(e.target.value) })}
                      className="border p-1 rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={editItem.description ?? ''}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      className="border p-1 rounded"
                    />
                  </td>
                  {canEdit && (
                    <td className="border p-2 text-center">
                      <button onClick={saveEdit} className="text-green-600 mr-2">
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setEditItem({})
                        }}
                        className="text-gray-600"
                      >
                        Cancel
                      </button>
                    </td>
                  )}
                </>
              ) : (
                <>
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2 capitalize">{item.type}</td>
                  <td className="border p-2">{item.rarity}</td>
                  <td className="border p-2">{item.encumbrance}</td>
                  <td className="border p-2">{item.price}</td>
                  <td className="border p-2">{item.description}</td>
                  {canEdit && (
                    <td className="border p-2 text-center">
                      <button onClick={() => startEdit(item)} className="text-blue-600 mr-2">
                        Edit
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="text-red-600">
                        Delete
                      </button>
                    </td>
                  )}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}