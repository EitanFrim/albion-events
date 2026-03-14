'use client'

import { useState, useRef, useEffect } from 'react'

interface RoleSlot { id: string; roleName: string; capacity: number }
interface Party { id: string; name: string; roleSlots: RoleSlot[] }

interface Props {
  eventId: string
  token: string
  parties: Party[]
  discordUsername: string
  roleColors: Record<string, string>
}

export function TokenSignupForm({ eventId, token, parties, discordUsername, roleColors }: Props) {
  const allRoles = Array.from(new Set(parties.flatMap(p => p.roleSlots.map(s => s.roleName))))

  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/events/${eventId}/signup-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, preferredRoles: selectedRoles, note }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to sign up')
      }
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="card p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display font-600 text-text-primary text-lg">You&apos;re signed up!</h3>
        <p className="text-text-secondary text-sm">
          Your role preferences have been submitted. The officers will assign you before the event starts.
        </p>
        <div className="flex flex-wrap justify-center gap-1.5 pt-2">
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
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <div>
        <h3 className="font-display font-600 text-text-primary text-sm">Sign Up</h3>
        <p className="text-xs text-text-muted mt-1">
          Signing up as <span className="text-accent font-medium">{discordUsername}</span>
        </p>
      </div>

      {/* Role selection */}
      <div>
        <label className="label">
          Preferred roles
          <span className="ml-1 normal-case font-body tracking-normal text-text-muted">— pick up to 3 in priority order</span>
        </label>

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
                  <span className="opacity-50">&times;</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(v => !v)}
            disabled={selectedRoles.length >= 3}
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
          className="input resize-none text-xs" />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button type="submit" disabled={loading || selectedRoles.length === 0}
        className="btn-primary w-full justify-center text-sm">
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  )
}
