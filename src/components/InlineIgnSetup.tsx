'use client'

import { useState } from 'react'

interface Props {
  eventId: string
  token: string
  serverRegion: string | null
}

export function InlineIgnSetup({ eventId, token, serverRegion }: Props) {
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Enter your in-game name'); return }
    if (!serverRegion && !region) { setError('Select your server region'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/events/${eventId}/signup-token`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          inGameName: trimmed,
          region: serverRegion ? undefined : region,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to verify name')
      }

      // Reload to show the signup form now that IGN is set
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          <h3 className="font-display font-700 text-text-primary text-sm">Set Your In-Game Name</h3>
        </div>
        <p className="text-xs text-text-secondary">
          Before you can sign up, we need your Albion Online character name so leaders can identify you on rosters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Character Name</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder="Your exact Albion Online name"
            maxLength={64}
            className="input w-full"
            autoFocus
          />
          <p className="text-text-muted text-[11px] mt-1">Must match your exact character name</p>
        </div>

        {!serverRegion && (
          <div>
            <label className="label">Server Region</label>
            <select
              value={region}
              onChange={e => { setRegion(e.target.value); setError('') }}
              className="input w-full"
            >
              <option value="">Select region...</option>
              <option value="americas">Americas</option>
              <option value="europe">Europe</option>
              <option value="asia">Asia</option>
            </select>
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="btn-primary w-full justify-center"
        >
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>
      </form>
    </div>
  )
}
