'use client'

import { useState, useEffect } from 'react'
import { EventStatus } from '@prisma/client'

interface UserRef { id: string; discordName: string; inGameName?: string | null; avatarUrl: string | null }
interface Assignment { id: string; userId: string; roleSlotId: string; user: UserRef }
interface RoleSlot { id: string; roleName: string; capacity: number; tags: string[]; minIp: number | null; assignments: Assignment[] }
interface Party { id: string; name: string; roleSlots: RoleSlot[] }
interface Signup {
  id: string; userId: string; preferredRoles: string[]; note: string | null; status: string
  user: UserRef; assignment: { id: string; roleSlot: { roleName: string; id: string } } | null
}
interface Props {
  event: { id: string; status: EventStatus; title: string }
  parties: Party[]
  signups: Signup[]
  guildSlug?: string
}

function displayName(user: UserRef) { return user.inGameName || user.discordName }

function safeSpecs(specializations: Record<string, string[]>, userId: string): string[] {
  const val = specializations[userId]
  return Array.isArray(val) ? val : []
}

export function AssignmentBoard({ event, parties: initialParties, signups: initialSignups, guildSlug }: Props) {
  const [parties, setParties] = useState<Party[]>(initialParties)
  const [signups, setSignups] = useState<Signup[]>(initialSignups)
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [roleColorMap, setRoleColorMap] = useState<Record<string, string>>({})
  const [specializations, setSpecializations] = useState<Record<string, string[]>>({})

  const isReadonly = event.status === 'COMPLETED'

  useEffect(() => {
    fetch('/api/guild-roles2')
      .then(r => r.json())
      .then((roles: { name: string; category: { color: string } | null }[]) => {
        const map: Record<string, string> = {}
        roles.forEach(r => { map[r.name.toLowerCase()] = r.category?.color ?? '#6b7280' })
        setRoleColorMap(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const qs = guildSlug ? `?guildSlug=${guildSlug}` : ''
    fetch(`/api/specialists${qs}`)
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Ensure all values are arrays
          const safe: Record<string, string[]> = {}
          for (const [key, val] of Object.entries(data)) {
            safe[key] = Array.isArray(val) ? val : []
          }
          setSpecializations(safe)
        }
      })
      .catch(() => {})
  }, [])

  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  useEffect(() => {
    if (isReadonly) return
    async function refreshSignups() {
      try {
        const res = await fetch(`/api/events/${event.id}/signups`)
        if (res.ok) { setSignups(await res.json()); setLastSynced(new Date()) }
      } catch {}
    }
    refreshSignups()
    window.addEventListener('focus', refreshSignups)
    const interval = setInterval(refreshSignups, 20_000)
    return () => { window.removeEventListener('focus', refreshSignups); clearInterval(interval) }
  }, [event.id, isReadonly])

  function getRoleColor(roleName: string) {
    return roleColorMap[roleName.toLowerCase()] ?? '#6b7280'
  }

  const assignedUserIds = new Set(parties.flatMap(p => p.roleSlots.flatMap(s => s.assignments.map(a => a.userId))))

  const activeSignups = signups.filter(s => s.status === 'ACTIVE')
  const withdrawnSignups = signups.filter(s => s.status === 'WITHDRAWN')
  const withdrawnAssigned = withdrawnSignups.filter(s => assignedUserIds.has(s.userId))
  const waitlist = activeSignups.filter(s => !assignedUserIds.has(s.userId))
  const assigned = activeSignups.filter(s => assignedUserIds.has(s.userId))

  const filterText = filter.toLowerCase()
  const filteredWaitlist = filterText
    ? waitlist.filter(s =>
        s.user.discordName.toLowerCase().includes(filterText) ||
        (s.user.inGameName ?? '').toLowerCase().includes(filterText) ||
        s.preferredRoles.some(r => r.toLowerCase().includes(filterText))
      )
    : waitlist

  const totalSlots = parties.reduce((a, p) => a + p.roleSlots.reduce((b, s) => b + s.capacity, 0), 0)
  const filledSlots = parties.reduce((a, p) => a + p.roleSlots.reduce((b, s) => b + s.assignments.length, 0), 0)

  function applyAssign(userId: string, roleSlotId: string, assignmentId: string, user: UserRef) {
    setParties(prev => prev.map(party => ({
      ...party,
      roleSlots: party.roleSlots.map(slot => {
        const withoutUser = slot.assignments.filter(a => a.userId !== userId)
        if (slot.id === roleSlotId) return { ...slot, assignments: [...withoutUser, { id: assignmentId, userId, roleSlotId, user }] }
        return { ...slot, assignments: withoutUser }
      }),
    })))
  }

  function applyUnassign(userId: string) {
    setParties(prev => prev.map(party => ({
      ...party,
      roleSlots: party.roleSlots.map(slot => ({ ...slot, assignments: slot.assignments.filter(a => a.userId !== userId) })),
    })))
  }

  async function assign(userId: string, roleSlotId: string) {
    setLoading(userId); setError('')
    try {
      const res = await fetch(`/api/events/${event.id}/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, roleSlotId }) })
      if (!res.ok) { setError((await res.json()).error); return }
      const data = await res.json()
      applyAssign(userId, roleSlotId, data.id, data.user)
      setSelectedUserId(null)
    } catch { setError('Failed to assign') }
    finally { setLoading(null) }
  }

  async function unassign(userId: string) {
    setLoading(userId); setError('')
    try {
      const res = await fetch(`/api/events/${event.id}/unassign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
      if (!res.ok) { setError((await res.json()).error); return }
      applyUnassign(userId)
    } catch { setError('Failed to unassign') }
    finally { setLoading(null) }
  }

  async function lockEvent() {
    if (!confirm('Lock signups? Players will no longer be able to sign up.')) return
    const res = await fetch(`/api/events/${event.id}/lock`, { method: 'POST' })
    if (res.ok) window.location.reload()
  }

  const activeSelected = selectedUserId ? activeSignups.find(s => s.userId === selectedUserId) : null

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-muted">Slots</span>
          <span className="font-mono text-text-primary font-medium">{filledSlots}/{totalSlots}</span>
          <div className="w-24 h-1.5 bg-bg-overlay rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${totalSlots ? (filledSlots / totalSlots) * 100 : 0}%` }} />
          </div>
        </div>
        <span className="text-sm text-amber-400 font-mono">{waitlist.length} waiting</span>
        {withdrawnAssigned.length > 0 && (
          <span className="text-sm text-amber-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {withdrawnAssigned.length} withdrawn but still assigned
          </span>
        )}
        {event.status === 'PUBLISHED' && !isReadonly && (
          <button onClick={lockEvent} className="btn-secondary text-xs ml-auto">🔒 Lock Signups</button>
        )}
        {lastSynced && (
          <span className="text-xs text-text-muted font-mono ml-auto">
            synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {error && <div className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-900/40 text-red-400 text-xs font-mono">{error}</div>}

      {/* Main layout */}
      <div className="flex gap-5 items-start">

        {/* LEFT: Parties */}
        <div className="flex-1 min-w-0 overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {parties.map(party => {
              const cap = party.roleSlots.reduce((a, s) => a + s.capacity, 0)
              const fill = party.roleSlots.reduce((a, s) => a + s.assignments.length, 0)
              return (
                <div key={party.id} className="card overflow-hidden flex-shrink-0 w-56">
                  <div className="px-3 py-2.5 border-b border-border-subtle flex items-center justify-between">
                    <span className="font-display font-600 text-text-primary text-xs tracking-wide">{party.name}</span>
                    <span className="text-xs font-mono text-text-muted">{fill}/{cap}</span>
                  </div>

                  <div className="p-2 space-y-1">
                    {party.roleSlots.map((slot, slotIndex) => {
                      const color = getRoleColor(slot.roleName)
                      const indent = (slotIndex % 8) * 3
                      const isPreferred = activeSelected?.preferredRoles.includes(slot.roleName) ?? false
                      const isSpec = activeSelected
                        ? safeSpecs(specializations, activeSelected.userId).some(s => s.toLowerCase() === slot.roleName.toLowerCase())
                        : false

                      return (
                        <div key={slot.id} style={{ marginLeft: `${indent}px` }}>
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-t-lg text-xs transition-all ${
                            isSpec ? 'ring-1 ring-amber-400/40' : isPreferred ? 'ring-1 ring-accent/30' : ''
                          }`}
                            style={{ backgroundColor: color + '18', borderLeft: `2px solid ${color}` }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="font-mono text-xs truncate flex-1" style={{ color }}>{slot.roleName}</span>
                            <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                              {isSpec && <span className="text-amber-400 text-xs" title="Specialist">⭐</span>}
                              <span className="font-mono text-text-muted text-xs">{slot.assignments.length}/{slot.capacity}</span>
                            </div>
                          </div>

                          <div className="ml-1 space-y-0.5 pb-1">
                            {Array.from({ length: slot.capacity }).map((_, i) => {
                              const assignment = slot.assignments[i]
                              const canAssignHere = activeSelected && !assignment && !isReadonly

                              if (assignment) {
                                const isWithdrawn = withdrawnSignups.some(s => s.userId === assignment.userId)
                                return (
                                  <div key={i}
                                    className={`flex items-center justify-between gap-1 py-1 px-2 rounded group border ${
                                      isWithdrawn
                                        ? 'bg-amber-950/30 border-amber-900/40'
                                        : 'bg-emerald-950/30 border-emerald-900/30'
                                    }`}>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isWithdrawn ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                      <span className={`text-xs truncate ${isWithdrawn ? 'text-amber-300/80 line-through' : 'text-emerald-300/90'}`}>
                                        {loading === assignment.userId ? '…' : displayName(assignment.user)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {isWithdrawn && (
                                        <span className="text-xs font-mono text-amber-400/70">withdrew</span>
                                      )}
                                      {!isReadonly && (
                                        <button
                                          onClick={() => unassign(assignment.userId)}
                                          disabled={!!loading}
                                          title={isWithdrawn ? 'Clear role' : 'Unassign'}
                                          className={`text-sm leading-none transition-all flex-shrink-0 ${
                                            isWithdrawn
                                              ? 'opacity-100 text-amber-400 hover:text-amber-300'
                                              : 'opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400'
                                          }`}
                                        >×</button>
                                      )}
                                    </div>
                                  </div>
                                )
                              }

                              return (
                                <button key={i}
                                  onClick={() => canAssignHere ? assign(activeSelected!.userId, slot.id) : undefined}
                                  disabled={!!loading || !canAssignHere}
                                  className={`w-full flex items-center gap-1.5 py-1 px-2 rounded transition-all text-left text-xs ${
                                    canAssignHere && isPreferred
                                      ? 'bg-emerald-950/50 border border-emerald-700/50 cursor-pointer hover:bg-emerald-950/80'
                                      : canAssignHere
                                      ? 'border border-dashed border-border hover:border-border-strong cursor-pointer'
                                      : 'cursor-default opacity-40'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full border flex-shrink-0 ${canAssignHere && isPreferred ? 'border-emerald-500' : 'border-border'}`} />
                                  <span className={
                                    canAssignHere && isPreferred ? 'text-emerald-400 font-mono' :
                                    canAssignHere ? 'text-text-muted' : 'text-text-muted italic'
                                  }>
                                    {canAssignHere && isPreferred ? '← assign' : 'open'}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT: Signups panel */}
        <div className="w-72 flex-shrink-0 space-y-3 sticky top-20">
          <input type="text" value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Search players..." className="input text-sm" />

          {!isReadonly && (
            <p className="text-xs text-text-muted">
              {selectedUserId ? '✓ Player selected — click a slot to assign' : 'Select a player below, then click a slot'}
            </p>
          )}

          {/* Withdrawn + still assigned */}
          {withdrawnAssigned.length > 0 && (
            <div>
              <p className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Withdrew · {withdrawnAssigned.length}
              </p>
              <div className="space-y-1.5">
                {withdrawnAssigned.map(signup => {
                  const assignedSlot = parties.flatMap(p => p.roleSlots).find(slot => slot.assignments.some(a => a.userId === signup.userId))
                  const color = assignedSlot ? getRoleColor(assignedSlot.roleName) : '#6b7280'
                  return (
                    <div key={signup.userId} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-amber-950/20 border border-amber-900/40">
                      <div className="min-w-0">
                        <span className="text-xs text-amber-300/80 line-through truncate block">{displayName(signup.user)}</span>
                        {assignedSlot && (
                          <span className="text-xs font-mono mt-0.5 inline-block px-1.5 py-0.5 rounded border"
                            style={{ backgroundColor: color + '18', color, borderColor: color + '44' }}>
                            {assignedSlot.roleName}
                          </span>
                        )}
                      </div>
                      {!isReadonly && assignedSlot && (
                        <button
                          onClick={() => unassign(signup.userId)}
                          disabled={!!loading}
                          className="flex-shrink-0 text-xs px-2 py-1 rounded bg-amber-900/40 text-amber-300 hover:bg-amber-900/70 transition-colors font-mono"
                        >
                          {loading === signup.userId ? '…' : 'Clear'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Waiting list */}
          <div>
            <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2">Waiting · {filteredWaitlist.length}</p>
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
              {filteredWaitlist.length === 0 && <p className="text-xs text-text-muted italic px-1">All active players assigned ✓</p>}
              {filteredWaitlist.map(signup => {
                const isSelected = selectedUserId === signup.userId
                const playerSpecs = safeSpecs(specializations, signup.userId)
                return (
                  <button key={signup.userId} onClick={() => setSelectedUserId(isSelected ? null : signup.userId)}
                    disabled={isReadonly}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${isSelected ? 'bg-accent/10 border-accent/40' : 'card hover:border-border'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-text-primary truncate">{displayName(signup.user)}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                        {isSelected && <span className="text-xs text-accent">selected</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {signup.preferredRoles.map((role) => {
                        const color = getRoleColor(role)
                        const isSpec = playerSpecs.some(s => s.toLowerCase() === role.toLowerCase())
                        return (
                          <span key={role} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono border"
                            style={{ backgroundColor: color + '18', color, borderColor: color + '44' }}>
                            {role}
                            {isSpec && <span className="text-amber-400" title="Specialist">⭐</span>}
                          </span>
                        )
                      })}
                    </div>
                    {playerSpecs.filter(s => !signup.preferredRoles.some(r => r.toLowerCase() === s.toLowerCase())).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {playerSpecs
                          .filter(s => !signup.preferredRoles.some(r => r.toLowerCase() === s.toLowerCase()))
                          .map(spec => {
                            const color = getRoleColor(spec)
                            return (
                              <span key={spec} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono border opacity-70"
                                style={{ backgroundColor: color + '10', color, borderColor: color + '30' }}>
                                ⭐ {spec}
                              </span>
                            )
                          })}
                      </div>
                    )}
                    {signup.note && <p className="text-text-muted text-xs mt-1 italic truncate">"{signup.note}"</p>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Assigned list */}
          {assigned.length > 0 && (
            <div>
              <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2">Assigned · {assigned.length}</p>
              <div className="space-y-1">
                {assigned.map(signup => {
                  const assignedSlot = parties.flatMap(p => p.roleSlots).find(slot => slot.assignments.some(a => a.userId === signup.userId))
                  const color = assignedSlot ? getRoleColor(assignedSlot.roleName) : '#6b7280'
                  return (
                    <div key={signup.userId} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle">
                      <span className="text-xs text-text-secondary truncate">{displayName(signup.user)}</span>
                      {assignedSlot && (
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded border ml-2 flex-shrink-0"
                          style={{ backgroundColor: color + '18', color, borderColor: color + '44' }}>
                          {assignedSlot.roleName}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Withdrawn (not assigned) */}
          {withdrawnSignups.filter(s => !assignedUserIds.has(s.userId)).length > 0 && (
            <div>
              <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2">Withdrew · {withdrawnSignups.filter(s => !assignedUserIds.has(s.userId)).length}</p>
              <div className="space-y-1">
                {withdrawnSignups.filter(s => !assignedUserIds.has(s.userId)).map(signup => (
                  <div key={signup.userId} className="flex items-center px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle opacity-50">
                    <span className="text-xs text-text-muted line-through truncate">{displayName(signup.user)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
