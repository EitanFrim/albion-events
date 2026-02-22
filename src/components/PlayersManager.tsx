'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PlayerStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'
type UserRole = 'ADMIN' | 'OFFICER' | 'PLAYER'

interface Player {
  id: string
  discordName: string
  inGameName: string | null
  avatarUrl: string | null
  role: UserRole
  status: PlayerStatus
  createdAt: string
  verifiedAt: string | null
}

interface Props {
  users: Player[]
  isAdmin: boolean
  currentUserId: string
}

const statusConfig: Record<PlayerStatus, { label: string; dot: string; text: string; bg: string }> = {
  PENDING:   { label: 'Pending',   dot: 'bg-amber-400',  text: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  ACTIVE:    { label: 'Active',    dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  SUSPENDED: { label: 'Suspended', dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
}

const roleConfig: Record<UserRole, { label: string; color: string }> = {
  ADMIN:   { label: 'Admin',   color: 'text-accent' },
  OFFICER: { label: 'Officer', color: 'text-purple-400' },
  PLAYER:  { label: 'Player',  color: 'text-text-muted' },
}

export function PlayersManager({ users: initialUsers, isAdmin, currentUserId }: Props) {
  const [users, setUsers] = useState<Player[]>(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<PlayerStatus | 'ALL'>('PENDING')
  const [search, setSearch] = useState('')
  const router = useRouter()

  async function updateUser(userId: string, data: { status?: PlayerStatus; role?: UserRole }) {
    setLoading(userId)
    try {
      const res = await fetch(`/api/admin/players/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u))
    } catch {
      alert('Action failed. Try again.')
    } finally {
      setLoading(null)
    }
  }

  const filtered = users.filter(u => {
    const matchStatus = filter === 'ALL' || u.status === filter
    const matchSearch = !search || 
      u.discordName.toLowerCase().includes(search.toLowerCase()) ||
      (u.inGameName ?? '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const pendingCount = users.filter(u => u.status === 'PENDING').length

  return (
    <div className="space-y-4">
      {/* Filter tabs + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-bg-elevated rounded-lg p-1 border border-border">
          {(['PENDING', 'ACTIVE', 'SUSPENDED', 'ALL'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors relative ${
                filter === s ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {s === 'PENDING' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-bg-base rounded-full text-xs flex items-center justify-center font-bold leading-none">
                  {pendingCount}
                </span>
              )}
              {s === 'ALL' ? 'All' : statusConfig[s].label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="input text-sm py-1.5 flex-1 min-w-[180px]"
        />

        <span className="text-xs text-text-muted font-mono ml-auto">
          {filtered.length} player{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-text-muted text-sm">
          {filter === 'PENDING' ? 'No players awaiting verification ✓' : 'No players found'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(player => {
            const sc = statusConfig[player.status]
            const rc = roleConfig[player.role]
            const isLoading = loading === player.id
            const isSelf = player.id === currentUserId

            return (
              <div key={player.id} className={`card p-4 flex flex-wrap items-center gap-4 ${
                player.status === 'PENDING' ? 'border-amber-900/30 bg-amber-950/10' : ''
              }`}>
                {/* Avatar + names */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt="" className="w-9 h-9 rounded-full flex-shrink-0 border border-border" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-text-muted text-xs font-mono">{player.discordName[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary truncate">{player.discordName}</span>
                      <span className={`text-xs font-mono ${rc.color}`}>{rc.label}</span>
                    </div>
                    {player.inGameName ? (
                      <span className="text-xs text-text-muted font-mono truncate">⚔️ {player.inGameName}</span>
                    ) : (
                      <span className="text-xs text-red-400/70 italic">No in-game name set</span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <span className={`text-xs font-mono px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${sc.bg} ${sc.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${player.status === 'PENDING' ? 'animate-pulse' : ''}`} />
                  {sc.label}
                </span>

                {/* Joined date */}
                <span className="text-xs text-text-muted font-mono hidden sm:block">
                  {new Date(player.createdAt).toLocaleDateString()}
                </span>

                {/* Actions */}
                {!isSelf && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {player.status === 'PENDING' && (
                      <button
                        onClick={() => updateUser(player.id, { status: 'ACTIVE' })}
                        disabled={isLoading}
                        className="btn-primary text-xs py-1 px-3"
                      >
                        {isLoading ? '…' : '✓ Verify'}
                      </button>
                    )}
                    {player.status === 'ACTIVE' && (
                      <button
                        onClick={() => updateUser(player.id, { status: 'SUSPENDED' })}
                        disabled={isLoading}
                        className="btn-danger text-xs py-1 px-3"
                      >
                        {isLoading ? '…' : 'Suspend'}
                      </button>
                    )}
                    {player.status === 'SUSPENDED' && (
                      <button
                        onClick={() => updateUser(player.id, { status: 'ACTIVE' })}
                        disabled={isLoading}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        {isLoading ? '…' : 'Reinstate'}
                      </button>
                    )}

                    {/* Role selector — admin only */}
                    {isAdmin && player.role !== 'ADMIN' && (
                      <select
                        value={player.role}
                        onChange={e => updateUser(player.id, { role: e.target.value as UserRole })}
                        disabled={isLoading}
                        className="input text-xs py-1 pr-7 w-28"
                      >
                        <option value="PLAYER">Player</option>
                        <option value="OFFICER">Officer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    )}
                  </div>
                )}
                {isSelf && (
                  <span className="text-xs text-text-muted/50 font-mono italic">you</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
