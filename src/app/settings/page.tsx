// Settings administration page.  Allows configuration of system and domain
// toggles as well as SMTP email settings, backup path and retention, and
// display preferences.  Fetches current settings from `/api/settings` on
// mount and saves updates back to the server.  Access should be
// restricted to OWNER users.
'use client'

import { useEffect, useState } from 'react'

interface Settings {
  id: string
  systemToggles: Record<string, boolean>
  domainToggles: Record<string, boolean>
  smtpHost?: string | null
  smtpPort?: number | null
  smtpUser?: string | null
  smtpPass?: string | null
  smtpFrom?: string | null
  smtpTLS?: boolean | null
  backupPath?: string | null
  backupRetentionDays?: number | null
  theme: string
  locale: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleToggle(section: 'systemToggles' | 'domainToggles', key: string) {
    if (!settings) return
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: !settings[section][key],
      },
    })
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    const { id, ...payload } = settings
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      setSettings(data)
    }
    setSaving(false)
  }

  if (loading || !settings) return <main className="p-8">Loading…</main>

  const systemKeys = Object.keys(settings.systemToggles)
  const domainKeys = Object.keys(settings.domainToggles)

  return (
    <main className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">System Toggles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {systemKeys.map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.systemToggles[key]}
                onChange={() => handleToggle('systemToggles', key)}
              />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Domain Toggles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {domainKeys.map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.domainToggles[key]}
                onChange={() => handleToggle('domainToggles', key)}
              />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">SMTP Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="font-semibold">Host</span>
            <input
              type="text"
              value={settings.smtpHost ?? ''}
              onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              className="border p-2 rounded"
            />
          </label>
          <label className="flex flex-col">
            <span className="font-semibold">Port</span>
            <input
              type="number"
              value={settings.smtpPort ?? ''}
              onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || undefined })}
              className="border p-2 rounded"
            />
          </label>
          <label className="flex flex-col">
            <span className="font-semibold">User</span>
            <input
              type="text"
              value={settings.smtpUser ?? ''}
              onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              className="border p-2 rounded"
            />
          </label>
          <label className="flex flex-col">
            <span className="font-semibold">Password</span>
            <input
              type="password"
              value={settings.smtpPass ?? ''}
              onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
              className="border p-2 rounded"
            />
          </label>
          <label className="flex flex-col">
            <span className="font-semibold">From Email</span>
            <input
              type="text"
              value={settings.smtpFrom ?? ''}
              onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
              className="border p-2 rounded"
            />
          </label>
          <label className="flex flex-col mt-6">
            <span className="font-semibold">Use TLS</span>
            <input
              type="checkbox"
              checked={Boolean(settings.smtpTLS)}
              onChange={(e) => setSettings({ ...settings, smtpTLS: e.target.checked })}
            />
          </label>
        </div>
        <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" disabled>
          Send Test Email (todo)
        </button>
      </section>
      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </main>
  )
}