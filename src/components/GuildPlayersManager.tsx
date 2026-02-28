'use client'

import { useState, useMemo } from 'react'

type MemberRole = 'OWNER' | 'OFFICER' | 'PLAYER' | 'ALLIANCE' | 'GUEST'
type MemberStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'
type SortKey = 'name' | 'role' | 'balance' | 'joined'
type SortDir = 'asc' | 'desc'

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

const roleConfig: Record<MemberRole, { label: string; color: string; bg: string }> = {
  OWNER:    { label: 'Owner',    color: 'text-amber-300',  bg: 'bg-amber-500/15 border-amber-500/25' },
  OFFICER:  { label: 'Officer',  color: 'text-purple-300', bg: 'bg-purple-500/15 border-purple-500/25' },
  PLAYER:   { label: 'Member',   color: 'text-slate-300',  bg: 'bg-slate-500/15 border-slate-500/25' },
  ALLIANCE: { label: 'Alliance', color: 'text-sky-300',    bg: 'bg-sky-500/15 border-sky-500/25' },
  GUEST:    { label: 'Guest',    color: 'text-gray-400',   bg: 'bg-gray-500/15 border-gray-500/25' },
}

export function GuildPlayersManager({ members: initial, guildSlug, isOwner, currentUserId }: Props) {
  const [members, setMembers] = useState<Member[]>(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<MemberStatus | 'ALL'>('ACTIVE')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
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

  async function removeMember(userId: string, name: string, balance: number) {
    const balanceWarning = balance !== 0
      ? `\n\nThis player has a balance of ${balance.toLocaleString()} silver which will be permanently deleted.`
      : ''
    if (!confirm(`Permanently remove ${name} from the guild?${balanceWarning}\n\nThis action cannot be undone. If you just want to temporarily remove them, use Suspend instead.`)) return
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

  const totalCount = members.length
  const activeCount = members.filter(m => m.status === 'ACTIVE').length
  const pendingCount = members.filter(m => m.status === 'PENDING').length
  const suspendedCount = members.filter(m => m.status === 'SUSPENDED').length

  const roleRank: Record<MemberRole, number> = { OWNER: 0, OFFICER: 1, PLAYER: 2, ALLIANCE: 3, GUEST: 4 }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'balance' ? 'desc' : 'asc')
    }
  }

  const filtered = useMemo(() => {
    const list = members.filter(m => {
      const matchStatus = filter === 'ALL' || m.status === filter
      const q = search.toLowerCase()
      const matchSearch = !q ||
        m.user.discordName.toLowerCase().includes(q) ||
        (m.user.inGameName ?? '').toLowerCase().includes(q)
      return matchStatus && matchSearch
    })

    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': {
          const nameA = (a.user.inGameName ?? a.user.discordName).toLowerCase()
          const nameB = (b.user.inGameName ?? b.user.discordName).toLowerCase()
          cmp = nameA.localeCompare(nameB)
          break
        }
        case 'role':
          cmp = roleRank[a.role] - roleRank[b.role]
          break
        case 'balance':
          cmp = a.balance - b.balance
          break
        case 'joined':
          cmp = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
          break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })

    return list
  }, [members, filter, search, sortKey, sortDir])

  const sortOptions: { key: SortKey; label: string; icon: string }[] = [
    { key: 'name', label: 'Name', icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z' },
    { key: 'role', label: 'Role', icon: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z' },
    { key: 'balance', label: 'Balance', icon: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
    { key: 'joined', label: 'Joined', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75' },
  ]

  const filterTabs: { key: MemberStatus | 'ALL'; label: string; count: number }[] = [
    { key: 'ACTIVE', label: 'Active', count: activeCount },
    { key: 'PENDING', label: 'Pending', count: pendingCount },
    { key: 'SUSPENDED', label: 'Suspended', count: suspendedCount },
    { key: 'ALL', label: 'All', count: totalCount },
  ]

  return (
    <div className="space-y-5">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: totalCount, accent: 'text-text-primary', glow: '' },
          { label: 'Active', value: activeCount, accent: 'text-emerald-400', glow: 'shadow-[inset_0_1px_0_0_rgba(52,211,153,0.1)]' },
          { label: 'Pending', value: pendingCount, accent: 'text-amber-400', glow: pendingCount > 0 ? 'shadow-[inset_0_1px_0_0_rgba(251,191,36,0.1)]' : '' },
          { label: 'Suspended', value: suspendedCount, accent: 'text-red-400', glow: '' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl bg-bg-surface border border-border-subtle p-4 ${stat.glow}`}>
            <p className="text-[11px] font-mono uppercase tracking-widest text-text-muted mb-1">{stat.label}</p>
            <p className={`text-2xl font-display font-700 ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pending banner */}
      {pendingCount > 0 && filter !== 'PENDING' && (
        <button
          onClick={() => setFilter('PENDING')}
          className="w-full group flex items-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all text-left"
        >
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <span className="text-sm text-amber-300 font-medium">
            {pendingCount} player{pendingCount !== 1 ? 's' : ''} awaiting verification
          </span>
          <svg className="w-4 h-4 text-amber-400/50 ml-auto group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Filter tabs + Search */}
      <div className="rounded-xl bg-bg-surface border border-border-subtle p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`relative px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                filter === tab.key
                  ? 'bg-accent/15 text-accent border border-accent/25 shadow-[0_0_12px_rgba(249,115,22,0.1)]'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated border border-transparent'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] font-mono ${
                filter === tab.key ? 'text-accent/70' : 'text-text-muted/60'
              }`}>
                {tab.count}
              </span>
              {tab.key === 'PENDING' && pendingCount > 0 && filter !== 'PENDING' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="input text-sm py-2.5 pl-10 w-full"
          />
        </div>

        {/* Sort + Count */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted mr-1">Sort by</span>
          {sortOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => toggleSort(opt.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                sortKey === opt.key
                  ? 'bg-bg-elevated text-text-primary border border-border'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated/50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
              </svg>
              {opt.label}
              {sortKey === opt.key && (
                <span className="text-accent text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
          <span className="text-xs text-text-muted font-mono ml-auto">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Player List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-bg-surface border border-border-subtle p-12 text-center">
          <svg className="w-10 h-10 text-text-muted/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <p className="text-text-muted text-sm">
            {filter === 'PENDING' ? 'No players awaiting verification' : 'No players found'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(member => {
            const rc = roleConfig[member.role]
            const isLoading = loading === member.user.id
            const isSelf = member.user.id === currentUserId
            const displayName = member.user.inGameName ?? member.user.discordName

            return (
              <div
                key={member.id}
                className={`group rounded-xl border transition-all duration-200 hover:border-border-strong ${
                  member.status === 'PENDING'
                    ? 'bg-gradient-to-r from-amber-500/[0.04] to-bg-surface border-amber-500/15'
                    : member.status === 'SUSPENDED'
                      ? 'bg-bg-surface/60 border-border-subtle opacity-60 hover:opacity-100'
                      : 'bg-bg-surface border-border-subtle'
                }`}
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {member.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.user.avatarUrl}
                        alt=""
                        className={`w-10 h-10 rounded-full ring-2 ${
                          member.status === 'ACTIVE'
                            ? 'ring-emerald-500/30'
                            : member.status === 'PENDING'
                              ? 'ring-amber-500/30'
                              : 'ring-red-500/20'
                        }`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-bg-elevated to-bg-overlay flex items-center justify-center ring-2 ${
                        member.status === 'ACTIVE'
                          ? 'ring-emerald-500/30'
                          : member.status === 'PENDING'
                            ? 'ring-amber-500/30'
                            : 'ring-red-500/20'
                      }`}>
                        <span className="text-text-secondary text-sm font-display font-600">{displayName[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    {/* Online-style status dot */}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-surface ${
                      member.status === 'ACTIVE' ? 'bg-emerald-400' :
                      member.status === 'PENDING' ? 'bg-amber-400 animate-pulse' :
                      'bg-red-400'
                    }`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-text-primary truncate">{displayName}</span>
                      {isSelf && (
                        <span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">you</span>
                      )}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${rc.bg} ${rc.color}`}>
                        {rc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      {member.user.inGameName && member.user.inGameName !== member.user.discordName && (
                        <span className="font-mono truncate">{member.user.discordName}</span>
                      )}
                      {!member.user.inGameName && (
                        <span className="text-red-400/60 italic text-[11px]">No IGN set</span>
                      )}
                      <span className="hidden sm:inline font-mono">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Balance */}
                  <button
                    onClick={() => openBalanceModal(member.user.id, displayName, member.balance)}
                    disabled={isLoading}
                    className="flex-shrink-0 group/bal px-3 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors text-right"
                  >
                    <span className={`text-sm font-mono font-medium block ${
                      member.balance > 0 ? 'text-amber-400' : member.balance < 0 ? 'text-red-400' : 'text-text-muted'
                    }`}>
                      {member.balance.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono group-hover/bal:text-accent transition-colors">silver</span>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Verify buttons for pending */}
                    {!isSelf && member.role !== 'OWNER' && member.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateMember(member.user.id, { status: 'ACTIVE', role: 'PLAYER' })}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 hover:shadow-[0_0_12px_rgba(52,211,153,0.15)] transition-all"
                        >
                          {isLoading ? '...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => updateMember(member.user.id, { status: 'ACTIVE', role: 'ALLIANCE' })}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/15 text-sky-400 border border-sky-500/25 hover:bg-sky-500/25 transition-all"
                        >
                          {isLoading ? '...' : 'Alliance'}
                        </button>
                      </>
                    )}

                    {/* Reinstate for suspended */}
                    {!isSelf && member.role !== 'OWNER' && member.status === 'SUSPENDED' && (
                      <button
                        onClick={() => updateMember(member.user.id, { status: 'ACTIVE' })}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all"
                      >
                        {isLoading ? '...' : 'Reinstate'}
                      </button>
                    )}

                    {/* Role selector (owner only) */}
                    {isOwner && !isSelf && member.role !== 'OWNER' && (
                      <select
                        value={member.role}
                        onChange={e => updateMember(member.user.id, { role: e.target.value as MemberRole })}
                        disabled={isLoading}
                        className="bg-bg-elevated border border-border-subtle text-text-primary text-xs py-1.5 px-2 pr-7 rounded-lg focus:outline-none focus:border-accent/50 transition-colors"
                      >
                        <option value="GUEST">Guest</option>
                        <option value="PLAYER">Member</option>
                        <option value="ALLIANCE">Alliance</option>
                        <option value="OFFICER">Officer</option>
                      </select>
                    )}

                    {/* More actions dropdown-like area */}
                    {!isSelf && member.role !== 'OWNER' && (
                      <div className="flex items-center gap-0.5 ml-1">
                        {member.status === 'ACTIVE' && (
                          <button
                            onClick={() => updateMember(member.user.id, { status: 'SUSPENDED' })}
                            disabled={isLoading}
                            title="Suspend"
                            className="p-1.5 rounded-lg text-text-muted hover:text-orange-400 hover:bg-orange-500/10 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => removeMember(member.user.id, displayName, member.balance)}
                          disabled={isLoading}
                          title="Remove"
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Balance adjustment modal */}
      {balanceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setBalanceModal(null)}>
          <div
            className="w-full max-w-md rounded-2xl bg-bg-surface border border-border shadow-[0_24px_80px_rgba(0,0,0,0.5)] space-y-5 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 className="font-display font-700 text-text-primary text-lg">Adjust Balance</h3>
              <p className="text-text-secondary text-sm mt-1">
                {balanceModal.name} — current:{' '}
                <span className={`font-mono font-medium ${balanceModal.currentBalance < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                  {balanceModal.currentBalance.toLocaleString()} silver
                </span>
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 bg-bg-elevated rounded-xl p-1.5 border border-border-subtle">
              <button
                onClick={() => setBalanceMode('add')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  balanceMode === 'add'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.1)]'
                    : 'text-text-muted hover:text-text-secondary'
                }`}>
                + Add
              </button>
              <button
                onClick={() => setBalanceMode('deduct')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  balanceMode === 'deduct'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
                    : 'text-text-muted hover:text-text-secondary'
                }`}>
                - Deduct
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="label">Amount (silver)</label>
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
              <label className="label">Reason</label>
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
            <div className="flex gap-3 pt-1">
              <button onClick={() => setBalanceModal(null)} className="btn-ghost flex-1 text-sm py-2.5">
                Cancel
              </button>
              <button
                onClick={submitBalanceAdjustment}
                disabled={loading === balanceModal.userId || !balanceAmount || !balanceReason.trim()}
                className={`flex-1 text-sm py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  balanceMode === 'add'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_16px_rgba(52,211,153,0.15)]'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:shadow-[0_0_16px_rgba(239,68,68,0.15)]'
                } disabled:opacity-40 disabled:cursor-not-allowed`}>
                {loading === balanceModal.userId ? '...' : balanceMode === 'add' ? 'Add Silver' : 'Deduct Silver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
