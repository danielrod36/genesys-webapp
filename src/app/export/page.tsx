'use client'

import { useState } from 'react'

/**
 * Export page allows users to download data in CSV or JSON format for any
 * supported entity (characters, items, talents or skills). It triggers a
 * fetch to the API export route and forces the browser to download the
 * resulting file. The page offers a simple interface with two dropdowns
 * and an export button.
 */
export default function ExportPage() {
  const [entity, setEntity] = useState<'characters' | 'items' | 'talents' | 'skills'>('characters')
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const [downloading, setDownloading] = useState(false)

  async function handleExport() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/export/${entity}?format=${format}`, { method: 'GET' })
      if (!res.ok) {
        console.error('Export failed', await res.text())
        setDownloading(false)
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${entity}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <main className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Export Data</h1>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="font-semibold">Entity</span>
          <select value={entity} onChange={(e) => setEntity(e.target.value as any)} className="border p-2 rounded">
            <option value="characters">Characters</option>
            <option value="items">Items</option>
            <option value="talents">Talents</option>
            <option value="skills">Skills</option>
          </select>
        </label>
        <label className="flex flex-col">
          <span className="font-semibold">Format</span>
          <select value={format} onChange={(e) => setFormat(e.target.value as any)} className="border p-2 rounded">
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </label>
        <button onClick={handleExport} disabled={downloading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {downloading ? 'Exporting…' : 'Export'}
        </button>
      </div>
    </main>
  )
}