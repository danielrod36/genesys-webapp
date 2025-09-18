'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Login page.  Users enter their email (and optionally their name) and
 * authenticate against the back‑end.  On success the returned user
 * ID and role are stored in localStorage for subsequent requests.
 */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      if (res.ok) {
        const data = await res.json()
        // Save user info to localStorage
        localStorage.setItem('userId', data.id)
        localStorage.setItem('userRole', data.role)
        localStorage.setItem('userEmail', data.email)
        router.push('/')
      } else {
        const msg = await res.text()
        setError(msg)
      }
    } catch (err) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="font-semibold">Email</span>
          <input
            type="email"
            className="border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col">
          <span className="font-semibold">Name (optional)</span>
          <input
            type="text"
            className="border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </main>
  )
}