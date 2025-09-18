// This client page lists all skills and provides inline editing and filtering
// capabilities.  Users can search by name and filter by characteristic
// (Brawn, Agility, etc.) or whether the skill is a career skill.  Saved
// filter views are stored in localStorage under `skillSavedFilters`.  Only
// users with OWNER or GM roles can edit or delete skills; others see a
// read‑only view.
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SkillDto {
  id: string
  name: string
  characteristic: string
  isCareerDefault: boolean
  description: string
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillDto[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSkill, setEditSkill] = useState<Partial<SkillDto>>({})
  const [search, setSearch] = useState('')
  // new filter states
  const [characteristicFilter, setCharacteristicFilter] = useState('')
  const [careerFilter, setCareerFilter] = useState('')
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: any }[]>([])
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/skills')
      if (res.ok) setSkills(await res.json())
      setLoading(false)
    }
    load()
    // load saved filters
    const saved = localStorage.getItem('skillSavedFilters')
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved))
      } catch {}
    }
    const role = localStorage.getItem('userRole')
    setCanEdit(role === 'OWNER' || role === 'GM')
  }, [])

  function startEdit(skill: SkillDto) {
    if (!canEdit) return
    setEditingId(skill.id)
    setEditSkill(skill)
  }

  async function saveEdit() {
    if (!editingId) return
    await fetch(`/api/skills/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editSkill),
    })
    setSkills((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...editSkill } as SkillDto : s)))
    setEditingId(null)
    setEditSkill({})
  }

  async function deleteSkill(id: string) {
    if (!canEdit) return
    await fetch(`/api/skills/${id}`, { method: 'DELETE' })
    setSkills((prev) => prev.filter((s) => s.id !== id))
  }

  function saveCurrentFilter() {
    const name = prompt('Name for this view:')
    if (!name) return
    const newSaved = [...savedFilters, { name, filters: { search, characteristicFilter, careerFilter } }]
    setSavedFilters(newSaved)
    localStorage.setItem('skillSavedFilters', JSON.stringify(newSaved))
  }

  function applySaved(index: number) {
    const s = savedFilters[index]
    if (!s) return
    setSearch(s.filters.search || '')
    setCharacteristicFilter(s.filters.characteristicFilter || '')
    setCareerFilter(s.filters.careerFilter || '')
  }

  function deleteSaved(index: number) {
    const newSaved = savedFilters.filter((_, i) => i !== index)
    setSavedFilters(newSaved)
    localStorage.setItem('skillSavedFilters', JSON.stringify(newSaved))
  }

  if (loading) return <main className="p-8">Loading…</main>

  const characteristics = Array.from(new Set(skills.map((s) => s.characteristic))).filter(Boolean)
  const filtered = skills
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => (characteristicFilter ? s.characteristic === characteristicFilter : true))
    .filter((s) => {
      if (!careerFilter) return true
      if (careerFilter === 'Yes') return s.isCareerDefault === true
      if (careerFilter === 'No') return s.isCareerDefault === false
      return true
    })

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Skills</h1>
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
            value={characteristicFilter}
            onChange={(e) => setCharacteristicFilter(e.target.value)}
            className="border p-2 rounded w-full sm:max-w-xs"
          >
            <option value="">All characteristics</option>
            {characteristics.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
          <select
            value={careerFilter}
            onChange={(e) => setCareerFilter(e.target.value)}
            className="border p-2 rounded w-full sm:max-w-xs"
          >
            <option value="">Any career default</option>
            <option value="Yes">Career</option>
            <option value="No">Non-career</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link href="/skills/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add Skill
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
            <th className="border p-2 text-left">Characteristic</th>
            <th className="border p-2 text-left">Career Default</th>
            <th className="border p-2 text-left">Description</th>
            {canEdit && <th className="border p-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((skill) => (
            <tr key={skill.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              {editingId === skill.id ? (
                <>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={editSkill.name ?? ''}
                      onChange={(e) => setEditSkill({ ...editSkill, name: e.target.value })}
                      className="border p-1 rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <select
                      value={editSkill.characteristic ?? ''}
                      onChange={(e) => setEditSkill({ ...editSkill, characteristic: e.target.value })}
                      className="border p-1 rounded"
                    >
                      <option value="BRAWN">Brawn</option>
                      <option value="AGILITY">Agility</option>
                      <option value="INTELLECT">Intellect</option>
                      <option value="CUNNING">Cunning</option>
                      <option value="WILLPOWER">Willpower</option>
                      <option value="PRESENCE">Presence</option>
                    </select>
                  </td>
                  <td className="border p-2">
                    <input
                      type="checkbox"
                      checked={editSkill.isCareerDefault ?? false}
                      onChange={(e) => setEditSkill({ ...editSkill, isCareerDefault: e.target.checked })}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={editSkill.description ?? ''}
                      onChange={(e) => setEditSkill({ ...editSkill, description: e.target.value })}
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
                          setEditSkill({})
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
                  <td className="border p-2">{skill.name}</td>
                  <td className="border p-2">{skill.characteristic}</td>
                  <td className="border p-2">{skill.isCareerDefault ? 'Yes' : 'No'}</td>
                  <td className="border p-2">{skill.description}</td>
                  {canEdit && (
                    <td className="border p-2 text-center">
                      <button onClick={() => startEdit(skill)} className="text-blue-600 mr-2">
                        Edit
                      </button>
                      <button onClick={() => deleteSkill(skill.id)} className="text-red-600">
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