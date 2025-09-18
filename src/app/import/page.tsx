'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CsvRecord {
  [key: string]: string
}

/**
 * A very naive CSV parser. It splits on newlines to get rows and then splits
 * each row on commas. It does not handle quoted fields or commas within
 * values. This is sufficient for simple import templates but should be
 * replaced with a robust parser in production.
 */
function parseCsv(text: string): CsvRecord[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  const records: CsvRecord[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const rec: CsvRecord = {}
    headers.forEach((h, idx) => {
      rec[h] = values[idx] ?? ''
    })
    records.push(rec)
  }
  return records
}

export default function ImportPage() {
  const router = useRouter()
  const [fileName, setFileName] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [records, setRecords] = useState<CsvRecord[]>([])
  const [mapping, setMapping] = useState<{ [field: string]: string }>({})
  const [entity, setEntity] = useState<'characters' | 'items' | 'talents' | 'skills'>('characters')
  const [step, setStep] = useState<number>(1)
  const [importing, setImporting] = useState(false)
  // Define internal fields for characters; can be extended later for other entities
  const internalFields = entity === 'characters'
    ? ['name', 'player_email', 'species', 'career', 'specializations', 'json_characteristics', 'json_derived', 'credits', 'encumbrance_curr', 'encumbrance_max', 'tags', 'obligation_json', 'duty_json', 'morality_json', 'custom_json', 'portrait_url']
    : entity === 'items'
    ? ['name', 'type', 'rarity', 'encumbrance', 'price', 'qualities_json', 'description', 'tags', 'custom_json']
    : entity === 'talents'
    ? ['name', 'tier', 'activation', 'ranked', 'prerequisites_json', 'description', 'tags', 'custom_json']
    : ['name', 'characteristic', 'isCareerDefault', 'description', 'tags', 'custom_json']

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (!text) return
      if (file.name.toLowerCase().endsWith('.csv')) {
        const recs = parseCsv(text)
        if (recs.length > 0) {
          setHeaders(Object.keys(recs[0]))
          setRecords(recs)
          // Initialize mapping with identical names where possible
          const initial: { [field: string]: string } = {}
          internalFields.forEach((field) => {
            const match = Object.keys(recs[0]).find((h) => h.toLowerCase() === field.toLowerCase())
            if (match) initial[field] = match
          })
          setMapping(initial)
          setStep(2)
        }
      } else if (file.name.toLowerCase().endsWith('.json')) {
        try {
          const json = JSON.parse(text)
          if (Array.isArray(json) && json.length > 0) {
            setHeaders(Object.keys(json[0]))
            setRecords(json as CsvRecord[])
            const initial: { [field: string]: string } = {}
            internalFields.forEach((field) => {
              const match = Object.keys(json[0]).find((h) => h.toLowerCase() === field.toLowerCase())
              if (match) initial[field] = match
            })
            setMapping(initial)
            setStep(2)
          }
        } catch (err) {
          console.error('Invalid JSON', err)
        }
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    setImporting(true)
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, mapping, records }),
      })
      if (res.ok) {
        // navigate to entity list after import
        router.push(`/${entity}`)
      } else {
        console.error('Import failed', await res.text())
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <main className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Import Data</h1>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="font-semibold mr-2">Entity:</label>
            <select value={entity} onChange={(e) => setEntity(e.target.value as any)} className="border p-2 rounded">
              <option value="characters">Characters</option>
              <option value="items">Items</option>
              <option value="talents">Talents</option>
              <option value="skills">Skills</option>
            </select>
          </div>
          <div>
            <input type="file" accept=".csv,.json" onChange={handleFileChange} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Map Fields</h2>
          <table className="min-w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border p-2">App Field</th>
                <th className="border p-2">CSV/JSON Column</th>
              </tr>
            </thead>
            <tbody>
              {internalFields.map((field) => (
                <tr key={field}>
                  <td className="border p-2 font-mono text-sm">{field}</td>
                  <td className="border p-2">
                    <select
                      className="border p-1 rounded"
                      value={mapping[field] ?? ''}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                    >
                      <option value="">-- none --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <h3 className="font-semibold mb-2">Preview (first 3 rows)</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-sm whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(records.slice(0, 3), null, 2)}
            </pre>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">Back</button>
            <button onClick={handleImport} disabled={importing} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {importing ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}