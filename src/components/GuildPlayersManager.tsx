'use client'

import { useState } from 'react'

type MemberRole = 'OWNER' | 'OFFICER' | 'PLAYER'
type MemberStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'

interface Member {
  id: string
  role: MemberRole
  status: MemberStatus
  joinedAt: string
  verifiedAt: string | null
  user: { id: string; discordName: string; inGameName: string | null; avatarUrl: string | null }
}

interface Props {
  members: Member[]
  guildSlug: string
  isOwner: boolean
  currentUserId: string
}

const statusConfig: Record<MemberStatus, { label: string; dot: string; text: string; bg: string }> = {
  PENDING:   { label: 'Pending',   dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  ACTIVE:    { label: 'Active',    dot: 'bg-emerald-400',  text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  SUSPENDED: { label: 'Suspended', dot: 'bg-red-400',      text: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
}

const roleConfig: Record<MemberRole, { label: string; color: string }> = {
  OWNER:   { label: 'Owner',   color: 'text-amber-400' },
  OFFICER: { label: 'Officer', color: 'text-purple-400' },
  PLAYER:  { label: 'Member',  color: 'text-text-muted' },
}

export function GuildPlayersManager({ members: initial, guildSlug, isOwner, currentUserId }: Props) {
  const [members, setMembers] = useState<Member[]>(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<MemberStatus | 'ALL'>('PENDING')
  const [search, setSearch] = useState('')

  async function updateMember(userId: string, data: { status?: MemberStatus; role?: MemberRole }) {
    setLoading(userId)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { alert('Action failed'); return }
      const updated = await res.json()
      setMembers(prev => prev.map(m => m.user.id === userId ? { ...m, ...updated, user: m.user } : m))
    } finally {
      setLoading(null)
    }
  }

  const pendingCount = members.filter(m => m.status === 'PENDING').length

  const filtered = members.filter(m => {
    const matchStatus = filter === 'ALL' || m.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      m.user.discordName.toLowerCase().includes(q) ||
      (m.user.inGameName ?? '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-bg-elevated rounded-lg p-1 border border-border">
          {(['PENDING', 'ACTIVE', 'SUSPENDED', 'ALL'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors relative ${
                filter === s ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
              }`}>
              {s === 'PENDING' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-bg-base rounded-full text-xs flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
              {s === 'ALL' ? 'All' : statusConfig[s].label}
            </button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…" className="input text-sm py-1.5 flex-1 min-w-[180px]" />
        <span className="text-xs text-text-muted font-mono ml-auto">{filtered.length} players</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-text-muted text-sm">
          {filter === 'PENDING' ? 'No players awaiting verification ✓' : 'No players found'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(member => {
            const sc = statusConfig[member.status]
            const rc = roleConfig[member.role]
            const isLoading = loading === member.user.id
            const isSelf = member.user.id === currentUserId

            return (
              <div key={member.id} className={`card p-4 flex flex-wrap items-center gap-4 ${
                member.status === 'PENDING' ? 'border-amber-900/30 bg-amber-950/10' : ''
              }`}>
                {/* Avatar + names */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {member.user.avatarUrl ? (
                    <img src={member.user.avatarUrl} alt="" className="w-9 h-9 rounded-full flex-shrink-0 border border-border" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-text-muted text-xs font-mono">{member.user.discordName[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary truncate">{member.user.discordName}</span>
                      <span className={`text-xs font-mono ${rc.color}`}>{rc.label}</span>
                    </div>
                    {member.user.inGameName ? (
                      <span className="text-xs text-text-muted font-mono">⚔️ {member.user.inGameName}</span>
                    ) : (
                      <span className="text-xs text-red-400/70 italic">No in-game name set</span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <span className={`text-xs font-mono px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${sc.bg} ${sc.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${member.status === 'PENDING' ? 'animate-pulse' : ''}`} />
                  {sc.label}
                </span>

                {/* Joined date */}
                <span className="text-xs text-text-muted font-mono hidden sm:block">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </span>

                {/* Actions */}
                {!isSelf && member.role !== 'OWNER' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {member.status === 'PENDING' && (
                      <button onClick={() => updateMember(member.user.id, { status: 'ACTIVE' })}
                        disabled={isLoading} className="btn-primary text-xs py-1 px-3">
                        {isLoading ? '…' : '✓ Verify'}
                      </button>
                    )}
                    {member.status === 'ACTIVE' && (
                      <button onClick={() => updateMember(member.user.id, { status: 'SUSPENDED' })}
                        disabled={isLoading} className="btn-danger text-xs py-1 px-3">
                        {isLoading ? '…' : 'Suspend'}
                      </button>
                    )}
                    {member.status === 'SUSPENDED' && (
                      <button onClick={() => updateMember(member.user.id, { status: 'ACTIVE' })}
                        disabled={isLoading} className="btn-secondary text-xs py-1 px-3">
                        {isLoading ? '…' : 'Reinstate'}
                      </button>
                    )}
                    {isOwner && (
                      <select value={member.role}
                        onChange={e => updateMember(member.user.id, { role: e.target.value as MemberRole })}
                        disabled={isLoading} className="input text-xs py-1 pr-7 w-28">
                        <option value="PLAYER">Member</option>
                        <option value="OFFICER">Officer</option>
                      </select>
                    )}
                  </div>
                )}
                {isSelf && <span className="text-xs text-text-muted/50 font-mono italic">you</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
