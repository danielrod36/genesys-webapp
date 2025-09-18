// This client page lists all talents with inline editing and advanced filtering.
// Users can search by name and filter by tier, activation type and whether
// the talent is ranked.  Saved views are persisted under
// `talentSavedFilters` in localStorage.  Only users with OWNER or GM
// roles can add, edit or delete talents; players and viewers see a
// read‑only listing.
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TalentDto {
  id: string
  name: string
  tier: number
  activation: string
  ranked: boolean
  description: string
}

export default function TalentsPage() {
  const [talents, setTalents] = useState<TalentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTalent, setEditTalent] = useState<Partial<TalentDto>>({})
  const [search, setSearch] = useState('')
  // new filter states
  const [tierFilter, setTierFilter] = useState('')
  const [activationFilter, setActivationFilter] = useState('')
  const [rankedFilter, setRankedFilter] = useState('')
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: any }[]>([])
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/talents')
      if (res.ok) setTalents(await res.json())
      setLoading(false)
    }
    load()
    // load saved filters from localStorage
    const saved = localStorage.getItem('talentSavedFilters')
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved))
      } catch {}
    }
    // determine edit permissions from userRole in localStorage
    const role = localStorage.getItem('userRole')
    setCanEdit(role === 'OWNER' || role === 'GM')
  }, [])

  function startEdit(talent: TalentDto) {
    if (!canEdit) return
    setEditingId(talent.id)
    setEditTalent(talent)
  }

  async function saveEdit() {
    if (!editingId) return
    await fetch(`/api/talents/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editTalent),
    })
    setTalents((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...editTalent } as TalentDto : t)))
    setEditingId(null)
    setEditTalent({})
  }

  async function deleteTalent(id: string) {
    if (!canEdit) return
    await fetch(`/api/talents/${id}`, { method: 'DELETE' })
    setTalents((prev) => prev.filter((t) => t.id !== id))
  }

  function saveCurrentFilter() {
    const name = prompt('Name for this view:')
    if (!name) return
    const newSaved = [...savedFilters, { name, filters: { search, tierFilter, activationFilter, rankedFilter } }]
    setSavedFilters(newSaved)
    localStorage.setItem('talentSavedFilters', JSON.stringify(newSaved))
  }

  function applySaved(index: number) {
    const s = savedFilters[index]
    if (!s) return
    setSearch(s.filters.search || '')
    setTierFilter(s.filters.tierFilter || '')
    setActivationFilter(s.filters.activationFilter || '')
    setRankedFilter(s.filters.rankedFilter || '')
  }

  function deleteSaved(index: number) {
    const newSaved = savedFilters.filter((_, i) => i !== index)
    setSavedFilters(newSaved)
    localStorage.setItem('talentSavedFilters', JSON.stringify(newSaved))
  }

  if (loading) return <main className="p-8">Loading…</main>

  // gather unique values for filters
  const tiers = Array.from(new Set(talents.map((t) => t.tier))).sort((a, b) => a - b)
  const activations = Array.from(new Set(talents.map((t) => t.activation))).filter(Boolean)

  const filtered = talents
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => (tierFilter ? String(t.tier) === tierFilter : true))
    .filter((t) => (activationFilter ? t.activation === activationFilter : true))
    .filter((t) => {
      if (!rankedFilter) return true
      if (rankedFilter === 'Yes') return t.ranked === true
      if (rankedFilter === 'No') return t.ranked === false
      return true
    })

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Talents</h1>
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
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="border p-2 rounded w-full sm:max-w-xs"
          >
            <option value="">All tiers</option>
            {tiers.map((tier) => (
              <option key={tier} value={String(tier)}>
                {tier}
              </option>
            ))}
          </select>
          <select
            value={activationFilter}
            onChange={(e) => setActivationFilter(e.target.value)}
            className="border p-2 rounded w-full sm:max-w-xs"
          >
            <option value="">Any activation</option>
            {activations.map((act) => (
              <option key={act} value={act} className="capitalize">
                {act}
              </option>
            ))}
          </select>
          <select
            value={rankedFilter}
            onChange={(e) => setRankedFilter(e.target.value)}
            className="border p-2 rounded w-full sm:max-w-xs"
          >
            <option value="">Any ranked</option>
            <option value="Yes">Ranked</option>
            <option value="No">Unranked</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link href="/talents/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add Talent
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
            <th className="border p-2 text-left">Tier</th>
            <th className="border p-2 text-left">Activation</th>
            <th className="border p-2 text-left">Ranked</th>
            <th className="border p-2 text-left">Description</th>
            {canEdit && <th className="border p-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((talent) => (
            <tr key={talent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              {editingId === talent.id ? (
                <>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={editTalent.name ?? ''}
                      onChange={(e) => setEditTalent({ ...editTalent, name: e.target.value })}
                      className="border p-1 rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={editTalent.tier ?? 1}
                      onChange={(e) => setEditTalent({ ...editTalent, tier: parseInt(e.target.value) })}
                      className="border p-1 rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={editTalent.activation ?? ''}
                      onChange={(e) => setEditTalent({ ...editTalent, activation: e.target.value })}
                      className="border p-1 rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="checkbox"
                      checked={editTalent.ranked ?? false}
                      onChange={(e) => setEditTalent({ ...editTalent, ranked: e.target.checked })}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={editTalent.description ?? ''}
                      onChange={(e) => setEditTalent({ ...editTalent, description: e.target.value })}
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
                          setEditTalent({})
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
                  <td className="border p-2">{talent.name}</td>
                  <td className="border p-2">{talent.tier}</td>
                  <td className="border p-2">{talent.activation}</td>
                  <td className="border p-2">{talent.ranked ? 'Yes' : 'No'}</td>
                  <td className="border p-2">{talent.description}</td>
                  {canEdit && (
                    <td className="border p-2 text-center">
                      <button onClick={() => startEdit(talent)} className="text-blue-600 mr-2">
                        Edit
                      </button>
                      <button onClick={() => deleteTalent(talent.id)} className="text-red-600">
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