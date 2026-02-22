'use client'

import { useState } from 'react'

interface Props { discordName: string; currentInGameName: string }

export function ProfileForm({ discordName, currentInGameName }: Props) {
  const [name, setName] = useState(currentInGameName)
  const [saved, setSaved] = useState(currentInGameName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Enter your in-game name'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inGameName: name.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSaved(name.trim())
      setSuccess('Saved!')
      setTimeout(() => window.location.reload(), 800)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="card p-6 space-y-5">
      <div>
        <label className="label">Discord</label>
        <div className="input bg-bg-base/50 text-text-secondary cursor-not-allowed">{discordName}</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">
            In-Game Name
            {!saved && <span className="ml-2 text-amber-400 normal-case font-body tracking-normal text-xs">— required</span>}
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setSuccess('') }}
            placeholder="Your Albion Online character name"
            maxLength={64}
            className="input"
            autoFocus={!saved}
          />
          <p className="text-text-muted text-xs mt-1">Shown to guild leaders on event rosters</p>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}
        {success && <p className="text-emerald-400 text-xs">✓ {success}</p>}

        <button type="submit" disabled={loading || name.trim() === saved} className="btn-primary w-full justify-center">
          {loading ? 'Saving…' : saved ? 'Update' : 'Save Name'}
        </button>
      </form>

      {saved && (
        <p className="text-xs text-text-muted pt-2 border-t border-border-subtle">
          Showing as: <span className="text-text-primary font-medium">{saved}</span>
        </p>
      )}
    </div>
  )
}
