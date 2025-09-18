'use client'

import { useEffect, useState } from 'react'

interface AuditEntry {
  id: string
  userId: string
  entityType: string
  entityId: string
  action: string
  diff: any
  createdAt: string
  user?: { email: string; name: string | null }
}

/**
 * Audit Log page.  Fetches the most recent audit entries from the API and
 * displays them in a table.  Users can filter by entity type using a
 * dropdown.  Each row shows who performed the action, what entity was
 * affected, the action type and the timestamp.  A toggle allows
 * expanding the diff JSON for inspection.
 */
export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      setLoading(true)
      const url = entityTypeFilter
        ? `/api/audit?entityType=${encodeURIComponent(entityTypeFilter)}`
        : '/api/audit'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      }
      setLoading(false)
    }
    load()
  }, [entityTypeFilter])

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const copy = new Set(prev)
      if (copy.has(id)) copy.delete(id)
      else copy.add(id)
      return copy
    })
  }

  if (loading) return <main className="p-8">Loading…</main>

  return (
    <main className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">Audit Log</h1>
      <div className="mb-4">
        <label className="font-semibold mr-2">Filter by entity type:</label>
        <select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All</option>
          <option value="Character">Character</option>
          <option value="Item">Item</option>
          <option value="Talent">Talent</option>
          <option value="Skill">Skill</option>
        </select>
      </div>
      <table className="min-w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="border p-2 text-left">When</th>
            <th className="border p-2 text-left">User</th>
            <th className="border p-2 text-left">Entity Type</th>
            <th className="border p-2 text-left">Action</th>
            <th className="border p-2 text-left">Entity ID</th>
            <th className="border p-2 text-left">Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="border p-2 whitespace-nowrap">
                {new Date(entry.createdAt).toLocaleString()}
              </td>
              <td className="border p-2 whitespace-nowrap">
                {entry.user?.name || entry.user?.email || entry.userId}
              </td>
              <td className="border p-2 whitespace-nowrap">{entry.entityType}</td>
              <td className="border p-2 whitespace-nowrap">{entry.action}</td>
              <td className="border p-2 whitespace-nowrap font-mono text-xs">
                {entry.entityId}
              </td>
              <td className="border p-2">
                <button
                  className="text-blue-600 underline"
                  onClick={() => toggleExpand(entry.id)}
                >
                  {expandedIds.has(entry.id) ? 'Hide' : 'Show'} Diff
                </button>
                {expandedIds.has(entry.id) && (
                  <pre className="mt-2 bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                    {JSON.stringify(entry.diff, null, 2)}
                  </pre>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}