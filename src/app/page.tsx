// Home page of the Genesys RPG Manager.  Serves as the landing page for
// authenticated users and presents navigation links to the main sections
// (Characters, Items, Talents, Skills, Settings, Import, Export and Audit).
// It checks if a user is logged in on mount; if not, the page redirects
// to the login screen.  Also provides a Sign Out button that clears
// credentials from localStorage.
'use client'
import Link from 'next/link'
import { useEffect } from 'react'


export default function HomePage() {
  useEffect(() => {
    // On mount, ensure the user is authenticated.  If not, redirect to login.
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    if (!userId) {
      window.location.href = '/login'
      return
    }
    // Check whether any setup tasks are outstanding.  If the narrative dice
    // font is missing and setup has not been marked complete in
    // localStorage, redirect to the setup wizard.
    ;(async () => {
      try {
        const res = await fetch('/api/setup')
        if (res.ok) {
          const data = await res.json()
          const fontsMissing = Boolean(data.fontsMissing)
          const setupDone = localStorage.getItem('setupComplete') === 'true'
          if (fontsMissing && !setupDone) {
            window.location.href = '/setup'
          }
        }
      } catch {
        // ignore errors here; allow user to continue if server unreachable
      }
    })()
  }, [])
  return (
    <main className="p-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Genesys RPG Manager</h1>
      <p className="text-lg">Welcome to your self‑hosted Genesys RPG management application. Use the navigation below to manage your game data.</p>
      <div className="mb-4">
        {/* Sign out button appears if a user is logged in */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('userId')
              localStorage.removeItem('userRole')
              localStorage.removeItem('userEmail')
              window.location.href = '/login'
            }
          }}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
        >
          Sign Out
        </button>
      </div>
      <nav className="flex flex-col gap-2">
        <Link href="/characters" className="underline text-blue-600">Characters</Link>
        <Link href="/items" className="underline text-blue-600">Items</Link>
        <Link href="/talents" className="underline text-blue-600">Talents</Link>
        <Link href="/skills" className="underline text-blue-600">Skills</Link>
        <Link href="/settings" className="underline text-blue-600">Settings</Link>
        <Link href="/import" className="underline text-blue-600">Import</Link>
        <Link href="/export" className="underline text-blue-600">Export</Link>
        <Link href="/audit" className="underline text-blue-600">Audit Log</Link>
      </nav>
    </main>
  )
}