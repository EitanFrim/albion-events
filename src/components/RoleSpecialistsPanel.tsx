'use client'

import { useState, useEffect, useRef } from 'react'

interface Player {
  id: string
  discordName: string
  inGameName: string | null
  avatarUrl: string | null
}

interface Spec {
  id: string
  userId: string
  user: Player
}

interface Props {
  roleId: string
  roleName: string
  color: string
  guildSlug?: string
}

export function RoleSpecialistsPanel({ roleId, roleName, color, guildSlug }: Props) {
  const [specs, setSpecs] = useState<Spec[]>([])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    fetch(`/api/guild-roles2/${roleId}/specialists`)
      .then(r => r.json()).then(setSpecs).catch(() => {})
    const plUrl = guildSlug ? `/api/admin/players-list?guildSlug=${guildSlug}` : '/api/admin/players-list'
    fetch(plUrl)
      .then(r => r.json()).then(setAllPlayers).catch(() => {})
  }, [open, roleId])

  useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 50)
  }, [adding])

  const specUserIds = new Set(specs.map(s => s.userId))
  const filtered = allPlayers.filter(p => {
    if (specUserIds.has(p.id)) return false
    if (!search.trim()) return false
    const q = search.toLowerCase()
    return p.discordName.toLowerCase().includes(q) || (p.inGameName ?? '').toLowerCase().includes(q)
  })

  async function addSpec(player: Player) {
    setLoading(true)
    try {
      const res = await fetch(`/api/guild-roles2/${roleId}/specialists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: player.id }),
      })
      if (res.ok) {
        const spec = await res.json()
        setSpecs(prev => [...prev, spec])
        setSearch('')
        setAdding(false)
      }
    } finally { setLoading(false) }
  }

  async function removeSpec(userId: string) {
    setLoading(true)
    try {
      await fetch(`/api/guild-roles2/${roleId}/specialists?userId=${userId}`, { method: 'DELETE' })
      setSpecs(prev => prev.filter(s => s.userId !== userId))
    } finally { setLoading(false) }
  }

  function displayName(p: Player) { return p.inGameName || p.discordName }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 text-xs transition-colors font-mono ${
          specs.length > 0 ? 'text-amber-400 hover:text-amber-300' : 'text-text-muted hover:text-text-secondary'
        }`}
        title="Manage specialists"
      >
        {specs.length > 0 ? '⭐' : '☆'}
        <span>{specs.length > 0 ? `${specs.length} specialist${specs.length !== 1 ? 's' : ''}` : 'Add specialists'}</span>
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-lg border border-border-subtle bg-bg-overlay space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs font-mono font-semibold" style={{ color }}>{roleName} Specialists</span>
            <button onClick={() => setOpen(false)} className="ml-auto text-text-muted hover:text-text-primary text-sm leading-none">×</button>
          </div>

          {/* Current specialists */}
          {specs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {specs.map(spec => (
                <div key={spec.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                  style={{ backgroundColor: color + '15', border: `1px solid ${color}33` }}>
                  <span className="text-amber-400">⭐</span>
                  <span style={{ color }}>{displayName(spec.user)}</span>
                  <button
                    onClick={() => removeSpec(spec.userId)}
                    disabled={loading}
                    className="text-text-muted hover:text-red-400 transition-colors leading-none ml-0.5"
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {/* Add player */}
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-1"
            >
              + Add player
            </button>
          ) : (
            <div className="space-y-1">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search player name…"
                className="input w-full text-xs py-1.5"
              />
              {filtered.slice(0, 6).map(player => (
                <button
                  key={player.id}
                  onClick={() => addSpec(player)}
                  disabled={loading}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors text-xs"
                >
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} className="w-5 h-5 rounded-full flex-shrink-0" alt="" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted text-xs flex-shrink-0">
                      {player.discordName[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="text-text-primary font-medium">{displayName(player)}</span>
                  {player.inGameName && player.inGameName !== player.discordName && (
                    <span className="text-text-muted">{player.discordName}</span>
                  )}
                </button>
              ))}
              {search.trim() && filtered.length === 0 && (
                <p className="text-xs text-text-muted italic px-2">No players found</p>
              )}
              <button onClick={() => { setAdding(false); setSearch('') }} className="text-xs text-text-muted hover:text-text-secondary">Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
