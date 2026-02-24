'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface RoleSlot { id: string; roleName: string; capacity: number }
interface Party { id: string; name: string; roleSlots: RoleSlot[] }

interface Props {
  eventId: string
  parties: Party[]
  existingSignup: { preferredRoles: string[]; note: string } | null
  isLocked: boolean
}

interface GuildRole { id: string; name: string; categoryId: string | null; category: { id: string; name: string; color: string } | null }

export function SignupForm({ eventId, parties, existingSignup, isLocked }: Props) {
  const router = useRouter()
  const allRoles = Array.from(new Set(parties.flatMap(p => p.roleSlots.map(s => s.roleName))))

  const [selectedRoles, setSelectedRoles] = useState<string[]>(existingSignup?.preferredRoles ?? [])
  const [note, setNote] = useState(existingSignup?.note ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [withdrawn, setWithdrawn] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [roleColors, setRoleColors] = useState<Record<string, string>>({})
  // Track whether this user has an active signup (prop OR just created one this session)
  const [isSignedUp, setIsSignedUp] = useState(!!existingSignup)
  // Compact vs editing mode — start compact if already signed up
  const [editing, setEditing] = useState(!existingSignup)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch role colors
  useEffect(() => {
    fetch('/api/guild-roles2')
      .then(r => r.json())
      .then((roles: GuildRole[]) => {
        const map: Record<string, string> = {}
        roles.forEach(r => { map[r.name.toLowerCase()] = r.category?.color ?? '#6b7280' })
        setRoleColors(map)
      })
      .catch(() => {})
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function getColor(roleName: string) {
    if (roleName === 'Fill') return '#6b7280'
    return roleColors[roleName.toLowerCase()] ?? '#6b7280'
  }

  function toggleRole(role: string) {
    setSelectedRoles(prev => {
      if (prev.includes(role)) return prev.filter(r => r !== role)
      if (prev.length >= 3) return prev
      return [...prev, role]
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedRoles.length === 0) { setError('Select at least one preferred role'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      const method = isSignedUp ? 'PUT' : 'POST'
      const res = await fetch(`/api/events/${eventId}/signup`, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredRoles: selectedRoles, note }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setIsSignedUp(true)
      setEditing(false)
      setSuccess(isSignedUp ? 'Updated!' : 'Signed up!')
      router.refresh()
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleWithdraw() {
    if (!confirm('Withdraw from this event?')) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/events/${eventId}/signup`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to withdraw')
        return
      }
      setWithdrawn(true)
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally { setLoading(false) }
  }

  if (withdrawn) return (
    <div className="card p-4 text-center">
      <p className="text-text-secondary text-sm">You&apos;ve withdrawn from this event.</p>
    </div>
  )

  /* ── Compact view: already signed up, not editing ── */
  if (isSignedUp && !editing) {
    return (
      <div className="card p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Signed Up
            </span>
          </div>
          {!isLocked && (
            <button
              type="button"
              onClick={() => { setEditing(true); setSuccess(''); setError('') }}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        {/* Role badges (compact) */}
        <div className="flex flex-wrap gap-1.5">
          {selectedRoles.map((role, i) => {
            const color = getColor(role)
            return (
              <span
                key={role}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                style={{ backgroundColor: color + '20', color, border: `1px solid ${color}40` }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {i + 1}
                </span>
                {role}
              </span>
            )
          })}
        </div>

        {/* Note (if any) */}
        {note && (
          <p className="text-xs text-text-muted italic truncate">
            {note}
          </p>
        )}

        {/* Success / Error messages */}
        {success && <p className="text-emerald-400 text-xs">{success}</p>}
        {error && <p className="text-red-400 text-xs">{error}</p>}

        {/* Withdraw button */}
        <button
          type="button" onClick={handleWithdraw} disabled={loading}
          className="w-full text-center text-xs text-text-muted hover:text-red-400 transition-colors py-1"
        >
          {loading ? 'Withdrawing…' : 'Withdraw'}
        </button>
      </div>
    )
  }

  /* ── Full editing / sign-up form ── */
  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-600 text-text-primary text-sm">
          {isSignedUp ? 'Edit Signup' : 'Sign Up'}
        </h3>
        {isSignedUp && (
          <button
            type="button"
            onClick={() => {
              // Reset to saved values and collapse
              setSelectedRoles(existingSignup?.preferredRoles ?? [])
              setNote(existingSignup?.note ?? '')
              setEditing(false)
              setError('')
              setSuccess('')
            }}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Role priority dropdown */}
      <div>
        <label className="label">
          Preferred roles
          <span className="ml-1 normal-case font-body tracking-normal text-text-muted">— pick up to 3 in priority order</span>
        </label>

        {/* Selected roles display (priority badges) */}
        {selectedRoles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedRoles.map((role, i) => {
              const color = getColor(role)
              return (
                <button
                  key={role} type="button" onClick={() => toggleRole(role)}
                  title="Click to remove"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-70"
                  style={{ backgroundColor: color + '25', color, border: `1px solid ${color}55` }}
                >
                  <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: color }}>
                    {i + 1}
                  </span>
                  {role}
                  <span className="opacity-50">×</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Dropdown trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(v => !v)}
            disabled={isLocked || selectedRoles.length >= 3}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-bg-elevated text-sm text-text-secondary hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span>
              {selectedRoles.length >= 3 ? 'All 3 priorities set' : `Add role ${selectedRoles.length + 1}${selectedRoles.length === 0 ? ' (primary)' : selectedRoles.length === 1 ? ' (secondary)' : ' (tertiary)'}`}
            </span>
            <svg className={`w-4 h-4 text-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && selectedRoles.length < 3 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-bg-elevated border border-border rounded-xl shadow-card-hover overflow-hidden">
              <div className="max-h-56 overflow-y-auto py-1">
                {allRoles.filter(r => !selectedRoles.includes(r)).map(role => {
                  const color = getColor(role)
                  return (
                    <button
                      key={role} type="button"
                      onClick={() => { toggleRole(role); if (selectedRoles.length >= 2) setDropdownOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-bg-overlay transition-colors text-left"
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm text-text-primary">{role}</span>
                    </button>
                  )
                })}
                {allRoles.filter(r => !selectedRoles.includes(r)).length === 0 && (
                  <p className="text-xs text-text-muted text-center py-3 italic">All roles selected</p>
                )}
                {!selectedRoles.includes('Fill') && (
                  <>
                    {allRoles.length > 0 && <div className="border-t border-border-subtle mx-2 my-1" />}
                    <button
                      type="button"
                      onClick={() => { toggleRole('Fill'); if (selectedRoles.length >= 2) setDropdownOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-bg-overlay transition-colors text-left"
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-text-muted/40" />
                      <span className="text-sm text-text-secondary italic">Fill</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="label">Note <span className="normal-case font-body tracking-normal text-text-muted">(IP, build, availability)</span></label>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="e.g. 1350 IP, T8 GA" rows={2} maxLength={500}
          disabled={isLocked} className="input resize-none text-xs" />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {success && <p className="text-emerald-400 text-xs">{success}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading || isLocked || selectedRoles.length === 0}
          className="btn-primary flex-1 justify-center text-xs">
          {loading ? 'Saving…' : isSignedUp ? 'Update' : 'Sign Up'}
        </button>
        {isSignedUp && (
          <button type="button" onClick={handleWithdraw} disabled={loading} className="btn-danger text-xs">
            Withdraw
          </button>
        )}
      </div>
    </form>
  )
}
