'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  hasInGameName: boolean
  currentInGameName: string
  status: string
  guildSlug?: string
}

export function OnboardingForm({ hasInGameName, currentInGameName, status, guildSlug }: Props) {
  const [name, setName] = useState(currentInGameName)
  const [submitted, setSubmitted] = useState(hasInGameName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit() {
    if (!name.trim()) { setError('In-game name is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inGameName: name.trim(), guildSlug }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to save')
      }
      const data = await res.json()
      if (data.inGameName) setName(data.inGameName) // use API-corrected casing
      setSubmitted(true)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Pending and name submitted — waiting for approval
  if (submitted && status === 'PENDING') {
    return (
      <div className="card p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-display font-600 text-text-primary text-lg mb-1">Awaiting Verification</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Your in-game name <span className="text-text-primary font-medium">{name}</span> has been submitted.
            A Game Master or Officer will verify your account shortly.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-amber-400/80 font-mono bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Pending verification
        </div>
        <button
          onClick={() => setSubmitted(false)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Wrong name? Change it
        </button>
      </div>
    )
  }

  // Suspended
  if (status === 'SUSPENDED') {
    return (
      <div className="card p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="font-display font-600 text-red-400 text-lg">Account Suspended</h2>
        <p className="text-text-secondary text-sm">Your account has been suspended. Contact a Game Master for assistance.</p>
      </div>
    )
  }

  // Form to set in-game name
  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="font-display font-600 text-text-primary text-lg mb-1">Set Your In-Game Name</h2>
        <p className="text-text-secondary text-sm">This is how you&apos;ll appear on event rosters. Use your exact Albion Online character name.</p>
      </div>

      <div>
        <label className="label">In-Game Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Your Albion Online character name"
          className="input w-full"
          autoFocus
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !name.trim()}
        className="btn-primary w-full justify-center"
      >
        {loading ? 'Verifying…' : 'Submit for Verification'}
      </button>

      <p className="text-xs text-text-muted text-center">
        After submitting, a Game Master or Officer will verify your account before you can join events.
      </p>
    </div>
  )
}
