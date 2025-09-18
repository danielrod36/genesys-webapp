"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Setup wizard page.  This page is shown on first run when critical
 * resources (like the Genesys narrative dice font) or configuration
 * (SMTP credentials) are missing.  It guides the admin through
 * uploading the required font and reminds them to fill in missing
 * settings.  Once all required assets are present, the admin can
 * complete the setup and proceed to the application.
 */
export default function SetupPage() {
  const router = useRouter()
  const [fontsMissing, setFontsMissing] = useState<boolean>(true)
  const [smtpMissing, setSmtpMissing] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')
  const [checkError, setCheckError] = useState<string>('')

  async function checkStatus() {
    try {
      const res = await fetch('/api/setup')
      if (res.ok) {
        const data = await res.json()
        setFontsMissing(Boolean(data.fontsMissing))
        setSmtpMissing(Boolean(data.smtpMissing))
      } else {
        setCheckError('Failed to check setup status')
      }
    } catch (err) {
      setCheckError('Unable to contact server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploading(true)
    setUploadError('')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/setup', { method: 'POST', body: formData })
      if (res.ok) {
        // Re-check status after upload
        await checkStatus()
      } else {
        const data = await res.json().catch(() => ({}))
        setUploadError(data.error || 'Upload failed')
      }
    } catch (err) {
      setUploadError('Network error during upload')
    } finally {
      setUploading(false)
    }
  }

  function finishSetup() {
    // Mark setup as complete in localStorage so we don't redirect again
    localStorage.setItem('setupComplete', 'true')
    router.push('/')
  }

  if (loading) {
    return <main className="p-8">Checking requirements…</main>
  }

  return (
    <main className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Initial Setup</h1>
      {checkError && <p className="text-red-600 mb-4">{checkError}</p>}
      {fontsMissing ? (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Upload Narrative Dice Font</h2>
          <p className="mb-2">
            This application requires a Genesys narrative dice font to display the success,
            failure and other dice symbols.  Due to licensing restrictions we cannot
            ship this font for you.  Please provide your own font file (TTF or OTF) below.
          </p>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <input type="file" name="fontFile" accept=".ttf,.otf" required className="border p-2" />
            {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {uploading ? 'Uploading…' : 'Upload Font'}
            </button>
          </form>
        </section>
      ) : (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Font Uploaded</h2>
          <p>The narrative dice font has been found.  You can proceed.</p>
        </section>
      )}
      {smtpMissing && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">SMTP Configuration Missing</h2>
          <p>
            SMTP credentials are not configured yet.  You will need to provide the SMTP
            host, port, username and password in the <strong>Settings</strong> page in order
            to send magic link emails and invitations.  You can continue the setup now and
            configure SMTP later.
          </p>
        </section>
      )}
      <button
        onClick={finishSetup}
        disabled={fontsMissing}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        Finish Setup
      </button>
    </main>
  )
}