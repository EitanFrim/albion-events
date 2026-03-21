'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  guildName: string
  guildSlug: string
  inviteCode: string
  existingIgn?: string | null
}

export function JoinGuildButton({ guildName, guildSlug, inviteCode, existingIgn }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)
  const [ign, setIgn] = useState(existingIgn ?? '')
  const router = useRouter()

  async function handleJoin() {
    const trimmed = ign.trim()
    if (!trimmed) {
      setError('Please enter your in-game name.')
      return
    }

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/guilds/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode, inGameName: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Join failed'); return }

      if (data.alreadyMember) {
        router.push(`/g/${guildSlug}`)
        return
      }

      setJoined(true)
    } finally {
      setLoading(false)
    }
  }

  if (joined) {
    return (
      <div className="card p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-display font-700 text-text-primary mb-1">Application Submitted</h2>
          <p className="text-text-secondary text-sm">
            Your application to <span className="text-text-primary font-semibold">{guildName}</span> has been submitted.
            A guild officer will review and verify your membership.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="ign" className="block text-xs font-mono text-text-muted uppercase tracking-widest mb-1.5">
          In-Game Name
        </label>
        <input
          id="ign"
          type="text"
          value={ign}
          onChange={e => setIgn(e.target.value)}
          placeholder="Your Albion Online character name"
          className="w-full px-4 py-2.5 rounded-lg bg-bg-base border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          disabled={loading}
        />
        <p className="text-[11px] text-text-muted mt-1.5">
          Must match your exact in-game name. This will be verified by a guild officer.
        </p>
      </div>
      <button onClick={handleJoin} disabled={loading || !ign.trim()} className="btn-primary w-full justify-center">
        {loading ? 'Submitting…' : 'Apply to Join'}
      </button>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <p className="text-xs text-text-muted text-center">
        Your application will be pending until verified by a guild officer.
      </p>
    </div>
  )
}
