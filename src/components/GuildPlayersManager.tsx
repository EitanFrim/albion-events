'use client'

import { useState } from 'react'

type MemberRole = 'OWNER' | 'OFFICER' | 'PLAYER'
type MemberStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'

interface Member {
  id: string
  role: MemberRole
  status: MemberStatus
  balance: number
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
  const [balanceModal, setBalanceModal] = useState<{
    userId: string
    name: string
    currentBalance: number
  } | null>(null)
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceMode, setBalanceMode] = useState<'add' | 'deduct'>('add')
  const [balanceReason, setBalanceReason] = useState('')

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

  async function removeMember(userId: string, name: string) {
    if (!confirm(`Remove ${name} from the guild? They will need to re-register.`)) return
    setLoading(userId)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/members/${userId}`, { method: 'DELETE' })
      if (!res.ok) { alert('Action failed'); return }
      setMembers(prev => prev.filter(m => m.user.id !== userId))
    } finally {
      setLoading(null)
    }
  }

  async function submitBalanceAdjustment() {
    if (!balanceModal) return
    const raw = parseInt(balanceAmount, 10)
    if (!raw || raw <= 0) { alert('Enter a valid positive amount'); return }
    if (!balanceReason.trim()) { alert('Please provide a reason'); return }
    const amount = balanceMode === 'deduct' ? -raw : raw

    setLoading(balanceModal.userId)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/members/${balanceModal.userId}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason: balanceReason.trim() }),
      })
      if (!res.ok) { alert('Failed to adjust balance'); return }
      const data = await res.json()
      setMembers(prev => prev.map(m =>
        m.user.id === balanceModal.userId ? { ...m, balance: data.balance } : m
      ))
      setBalanceModal(null)
      setBalanceAmount('')
      setBalanceReason('')
    } finally {
      setLoading(null)
    }
  }

  function openBalanceModal(userId: string, name: string, currentBalance: number) {
    setBalanceModal({ userId, name, currentBalance })
    setBalanceAmount('')
    setBalanceMode('add')
    setBalanceReason('')
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
                      <span className="text-xs text-text-muted font-mono">{member.user.inGameName}</span>
                    ) : (
                      <span className="text-xs text-red-400/70 italic">No in-game name set</span>
                    )}
                  </div>
                </div>

                {/* Balance */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-mono ${member.balance < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                    {member.balance.toLocaleString()}
                  </span>
                  <span className="text-xs text-text-muted">silver</span>
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isSelf && member.role !== 'OWNER' && (
                    <>
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
                    </>
                  )}
                  <button onClick={() => openBalanceModal(member.user.id, member.user.discordName, member.balance)}
                    disabled={isLoading} className="btn-ghost text-xs py-1 px-2 text-amber-400/70 hover:text-amber-400">
                    {isLoading ? '…' : 'Balance'}
                  </button>
                  {!isSelf && member.role !== 'OWNER' && (
                    <button onClick={() => removeMember(member.user.id, member.user.discordName)}
                      disabled={isLoading} className="btn-ghost text-xs py-1 px-2 text-red-400/70 hover:text-red-400">
                      {isLoading ? '…' : 'Remove'}
                    </button>
                  )}
                  {isOwner && !isSelf && member.role !== 'OWNER' && (
                    <select value={member.role}
                      onChange={e => updateMember(member.user.id, { role: e.target.value as MemberRole })}
                      disabled={isLoading} className="input text-xs py-1 pr-7 w-28">
                      <option value="PLAYER">Member</option>
                      <option value="OFFICER">Officer</option>
                    </select>
                  )}
                  {isSelf && <span className="text-xs text-text-muted/50 font-mono italic">you</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Balance adjustment modal */}
      {balanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setBalanceModal(null)}>
          <div className="card p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div>
              <h3 className="font-display font-bold text-text-primary text-lg">Adjust Balance</h3>
              <p className="text-text-secondary text-sm mt-1">
                {balanceModal.name} — current balance:{' '}
                <span className={`font-mono ${balanceModal.currentBalance < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                  {balanceModal.currentBalance.toLocaleString()} silver
                </span>
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 bg-bg-elevated rounded-lg p-1 border border-border">
              <button
                onClick={() => setBalanceMode('add')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                  balanceMode === 'add' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-text-muted hover:text-text-secondary'
                }`}>
                + Add
              </button>
              <button
                onClick={() => setBalanceMode('deduct')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                  balanceMode === 'deduct' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-text-muted hover:text-text-secondary'
                }`}>
                - Deduct
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs text-text-muted font-mono uppercase tracking-widest block mb-1.5">
                Amount (silver)
              </label>
              <input
                type="number"
                min="1"
                value={balanceAmount}
                onChange={e => setBalanceAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="input w-full"
                autoFocus
              />
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs text-text-muted font-mono uppercase tracking-widest block mb-1.5">
                Reason
              </label>
              <input
                type="text"
                value={balanceReason}
                onChange={e => setBalanceReason(e.target.value)}
                placeholder="e.g. Loot split from ZvZ"
                className="input w-full"
                maxLength={200}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setBalanceModal(null)} className="btn-ghost flex-1 text-sm py-2">
                Cancel
              </button>
              <button
                onClick={submitBalanceAdjustment}
                disabled={loading === balanceModal.userId || !balanceAmount || !balanceReason.trim()}
                className={`flex-1 text-sm py-2 rounded-lg font-medium transition-colors ${
                  balanceMode === 'add'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                } disabled:opacity-50`}>
                {loading === balanceModal.userId ? '…' : balanceMode === 'add' ? 'Add Silver' : 'Deduct Silver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
