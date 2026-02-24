'use client'

import { useState } from 'react'

interface Props { discordName: string; currentInGameName: string; guildSlug?: string; currentRegion?: string }

export function ProfileForm({ discordName, currentInGameName, guildSlug, currentRegion }: Props) {
  const [name, setName] = useState(currentInGameName)
  const [saved, setSaved] = useState(currentInGameName)
  const [region, setRegion] = useState(currentRegion ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Enter your in-game name'); return }
    if (!guildSlug && !region) { setError('Select a server region so we can verify your name'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inGameName: name.trim(), guildSlug, region: guildSlug ? undefined : region }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()
      const finalName = data.inGameName ?? name.trim()
      setName(finalName)
      setSaved(finalName)
      setSuccess('Verified & saved!')
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
            onChange={e => { setName(e.target.value); setSuccess(''); setError('') }}
            placeholder="Your Albion Online character name"
            maxLength={64}
            className="input"
            autoFocus={!saved}
          />
          <p className="text-text-muted text-xs mt-1">
            Must match your exact Albion Online character name
          </p>
        </div>

        {!guildSlug && (
          <div>
            <label className="label">
              Server Region
              {!region && <span className="ml-2 text-amber-400 normal-case font-body tracking-normal text-xs">— required</span>}
            </label>
            <select
              value={region}
              onChange={e => { setRegion(e.target.value); setSuccess(''); setError('') }}
              className="input w-full"
            >
              <option value="">Select region…</option>
              <option value="americas">Americas</option>
              <option value="europe">Europe</option>
              <option value="asia">Asia</option>
            </select>
            <p className="text-text-muted text-xs mt-1">
              Used to verify your character name against Albion Online
            </p>
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}
        {success && <p className="text-emerald-400 text-xs">✓ {success}</p>}

        <button type="submit" disabled={loading || name.trim() === saved} className="btn-primary w-full justify-center">
          {loading ? 'Verifying…' : saved ? 'Update' : 'Save Name'}
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
