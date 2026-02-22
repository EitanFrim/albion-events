'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  guildName: string
  guildSlug: string
  inviteCode: string
}

export function JoinGuildButton({ guildName, guildSlug, inviteCode }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)
  const router = useRouter()

  async function handleJoin() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/guilds/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
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
            You've joined <span className="text-text-primary font-semibold">{guildName}</span> as a pending member.
            An Officer needs to verify you before you can participate in events.
          </p>
        </div>
        <a href={`/g/${guildSlug}`} className="btn-secondary w-full justify-center">
          View Guild →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button onClick={handleJoin} disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Joining…' : `Join ${guildName}`}
      </button>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <p className="text-xs text-text-muted text-center">
        Your membership will be pending until verified by an Officer.
      </p>
    </div>
  )
}
