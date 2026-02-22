'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface GuildMembership {
  id: string
  role: string
  status: string
  guild: {
    id: string
    name: string
    slug: string
    description: string | null
    logoUrl: string | null
    _count: { members: number; events: number }
  }
}

interface Props {
  memberships: GuildMembership[]
}

const roleColors: Record<string, string> = {
  OWNER: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  OFFICER: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  PLAYER: 'text-text-muted bg-bg-elevated border-border',
}

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  OFFICER: 'Officer',
  PLAYER: 'Member',
}

export function GuildSelector({ memberships }: Props) {
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const router = useRouter()

  const active = memberships.filter(m => m.status === 'ACTIVE')
  const pending = memberships.filter(m => m.status === 'PENDING')

  async function handleJoin() {
    if (!joinCode.trim()) return
    setJoining(true); setJoinError('')
    try {
      const res = await fetch('/api/guilds/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error); return }
      if (data.alreadyMember) {
        router.push(`/g/${data.guild.slug}`)
      } else {
        router.refresh()
        setShowJoin(false)
        setJoinCode('')
      }
    } catch {
      setJoinError('Something went wrong')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Active guilds */}
      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-text-muted uppercase tracking-widest">Your Guilds</p>
          {active.map(m => (
            <Link key={m.id} href={`/g/${m.guild.slug}`}
              className="card p-4 flex items-center gap-4 hover:border-border hover:shadow-card-hover transition-all group block">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {m.guild.logoUrl ? (
                  <img src={m.guild.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">⚔️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-600 text-text-primary group-hover:text-accent transition-colors truncate">
                    {m.guild.name}
                  </span>
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${roleColors[m.role]}`}>
                    {roleLabels[m.role]}
                  </span>
                </div>
                {m.guild.description && (
                  <p className="text-xs text-text-muted truncate mt-0.5">{m.guild.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-text-muted font-mono">{m.guild._count.members} members</span>
                  <span className="text-xs text-text-muted font-mono">{m.guild._count.events} events</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* Pending guilds */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-text-muted uppercase tracking-widest">Pending Verification</p>
          {pending.map(m => (
            <div key={m.id} className="card p-4 flex items-center gap-4 opacity-60">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-display font-600 text-text-primary">{m.guild.name}</span>
                <p className="text-xs text-amber-400/80 mt-0.5">Awaiting officer verification</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link href="/guilds/new"
          className="btn-primary flex-1 justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create a Guild
        </Link>
        <button onClick={() => setShowJoin(v => !v)}
          className="btn-secondary flex-1 justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Join with Invite Code
        </button>
      </div>

      {showJoin && (
        <div className="card p-4 space-y-3">
          <p className="text-sm text-text-secondary">Enter the invite code shared by your guild leader.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="e.g. ABCD1234"
              className="input flex-1 font-mono tracking-widest text-center uppercase"
              maxLength={8}
              autoFocus
            />
            <button onClick={handleJoin} disabled={joining || !joinCode.trim()} className="btn-primary">
              {joining ? '…' : 'Join'}
            </button>
          </div>
          {joinError && <p className="text-red-400 text-xs">{joinError}</p>}
        </div>
      )}

      {memberships.length === 0 && !showJoin && (
        <p className="text-center text-text-muted text-sm pt-4">
          Create or join a guild to get started.
        </p>
      )}
    </div>
  )
}
