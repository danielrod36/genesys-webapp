'use client'

import { useEffect } from 'react'

/**
 * Initializes client‑side behaviours.  Patches the global fetch function to
 * automatically include the current user's ID (if any) in the `X-User-Id`
 * header on all requests.  This provides a simple mechanism for the
 * server to authenticate and authorize actions without requiring each
 * fetch call to set headers individually.  Only runs on the client.
 */
export default function InitializeClient() {
  useEffect(() => {
    const origFetch = window.fetch
    window.fetch = (input: RequestInfo, init?: RequestInit) => {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      const headers = new Headers(init?.headers || {})
      if (userId) headers.set('X-User-Id', userId)
      return origFetch(input, { ...init, headers })
    }
  }, [])
  return null
}