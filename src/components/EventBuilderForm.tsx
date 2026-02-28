'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { GuildCategory, GuildRole } from '@/components/RolesManager'
import { SlotNoteEditor, type SlotNote, hasNote, serializeSlotNote } from '@/components/SlotNoteEditor'

// Renders dropdown at fixed screen coords — escapes any overflow:hidden parent
function PickerDropdown({ anchorId, guildRoles, guildCategories, filter, onFilterChange, onSelect, onClose }: {
  anchorId: string
  guildRoles: GuildRole[]
  guildCategories: { id: string; name: string; color: string }[]
  filter: string
  onFilterChange: (v: string) => void
  onSelect: (role: GuildRole) => void
  onClose: () => void
}) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    function place() {
      const btn = document.getElementById(anchorId)
      if (!btn) return
      const r = btn.getBoundingClientRect()
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  }, [anchorId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const el = document.getElementById(`picker-portal-${anchorId}`)
      const btn = document.getElementById(anchorId)
      if (el && !el.contains(e.target as Node) && btn && !btn.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [anchorId, onClose])

  if (!pos) return null

  const filtered = filter
    ? guildRoles.filter(r => r.name.toLowerCase().includes(filter.toLowerCase()))
    : guildRoles

  const groups: { cat: { id: string; name: string; color: string } | null; roles: GuildRole[] }[] = []
  for (const cat of guildCategories) {
    const catRoles = filtered.filter(r => r.category?.id === cat.id)
    if (catRoles.length > 0) groups.push({ cat, roles: catRoles })
  }
  const uncat = filtered.filter(r => !r.category)
  if (uncat.length > 0) groups.push({ cat: null, roles: uncat })

  return createPortal(
    <div
      id={`picker-portal-${anchorId}`}
      style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className="bg-bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="p-2 border-b border-border-subtle">
        <input
          type="text" value={filter} onChange={e => onFilterChange(e.target.value)}
          placeholder="Search roles..." className="input text-xs py-1.5" autoFocus
          onKeyDown={e => e.key === 'Escape' && onClose()}
        />
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {groups.length === 0 && (
          <p className="text-xs text-text-muted text-center py-3">
            No roles found — <a href="/admin/roles" target="_blank" className="text-accent hover:underline">add some in Role Registry</a>
          </p>
        )}
        {groups.map((group, gi) => (
          <div key={gi}>
            <div className="px-3 pt-2 pb-0.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: group.cat?.color ?? '#6b7280' }} />
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider">{group.cat?.name ?? 'Uncategorized'}</span>
            </div>
            {group.roles.map(role => {
              const color = role.category?.color ?? '#6b7280'
              return (
                <button key={role.id} type="button" onClick={() => onSelect(role)}
                  className="w-full flex items-center gap-2.5 px-4 py-1.5 hover:bg-bg-overlay text-left transition-colors">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm text-text-primary">{role.name}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-border-subtle p-2">
        <a href="/admin/roles" target="_blank"
          className="w-full flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors justify-center py-1">
          Manage roles →
        </a>
      </div>
    </div>,
    document.body
  )
}

interface RoleSlotInput { roleName: string; color: string; capacity: number; minIp: string; note: SlotNote }
interface PartyInput { id?: string; name: string; roleSlots: RoleSlotInput[] }
interface Template { id: string; name: string; data: { parties: { name: string; slots: { roleName: string; capacity: number; note?: SlotNote }[] }[] } }

interface Props {
  initialData?: { title: string; description: string; startTime: string; timezone: string; locationNote: string; parties: PartyInput[]; visibility?: string }
  eventId?: string
  guildSlug?: string
}

function getTodayDate() { return new Date().toISOString().split('T')[0] }
function getDefaultTime() {
  const now = new Date()
  now.setUTCHours(now.getUTCHours() + 1, 0, 0, 0)
  return `${String(now.getUTCHours()).padStart(2, '0')}:00`
}

export function EventBuilderForm({ initialData, eventId, guildSlug }: Props) {
  const router = useRouter()

  // When editing, parse out siege hammer / sets flags from the saved description
  function parseInitialDesc(raw: string) {
    const parts = raw.split(/\n\n(?=⚔️ Siege Hammer|Sets: 1\+)/)
    const base = parts[0].trim()
    const suffix = parts.slice(1).join('\n\n')
    return {
      base,
      hasSiege: suffix.includes('⚔️ Siege Hammer'),
      sets: suffix.match(/Sets: 1\+(\d+)/)?.[1] ?? '',
    }
  }

  const initParsed = initialData?.description ? parseInitialDesc(initialData.description) : { base: '', hasSiege: false, sets: '' }

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initParsed.base)

  const initDate = initialData?.startTime ? new Date(initialData.startTime).toISOString().split('T')[0] : getTodayDate()
  const initTime = initialData?.startTime ? new Date(initialData.startTime).toISOString().split('T')[1].slice(0, 5) : getDefaultTime()
  const [startDate, setStartDate] = useState(initDate)
  const [startTime, setStartTime] = useState(initTime)
  const [locationNote, setLocationNote] = useState(initialData?.locationNote ?? '')
  const [parties, setParties] = useState<PartyInput[]>(initialData?.parties ?? [{ name: 'Party 1', roleSlots: [] }])
  const [visibility, setVisibility] = useState<'MEMBERS_ONLY' | 'PUBLIC'>(
    (initialData?.visibility as 'MEMBERS_ONLY' | 'PUBLIC') ?? 'MEMBERS_ONLY'
  )
  const [siegeHammer, setSiegeHammer] = useState(initParsed.hasSiege)
  const [extraSets, setExtraSets] = useState(initParsed.sets)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [guildRoles, setGuildRoles] = useState<GuildRole[]>([])
  const [guildCategories, setGuildCategories] = useState<{id:string;name:string;color:string}[]>([])
  const [templates, setTemplates] = useState<Template[]>([])

  const [pickerOpen, setPickerOpen] = useState<number | null>(null)
  const [pickerFilter, setPickerFilter] = useState('')
  const [noteOpen, setNoteOpen] = useState<string | null>(null) // `${pi}-${si}`
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const qs = guildSlug ? `?guildSlug=${guildSlug}` : ''
    fetch(`/api/guild-roles2${qs}`).then(r => r.json()).then((roles: GuildRole[]) => {
      setGuildRoles(roles)
      // Backfill colors into slots loaded from initialData (edit mode has no color)
      const colorMap: Record<string, string> = {}
      roles.forEach(r => { colorMap[r.name.toLowerCase()] = r.category?.color ?? '#6b7280' })
      setParties(prev => prev.map(p => ({
        ...p,
        roleSlots: p.roleSlots.map(s => ({
          ...s,
          color: colorMap[s.roleName.toLowerCase()] ?? s.color ?? '#6b7280',
        })),
      })))
    }).catch(() => {})
    fetch(`/api/guild-templates${qs}`).then(r => r.json()).then(setTemplates).catch(() => {})
    fetch(`/api/guild-categories${qs}`).then(r => r.json()).then((cats: any[]) => setGuildCategories(cats)).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Also check the portal dropdown — it renders in document.body outside pickerRef
      const portalEl = pickerOpen !== null
        ? document.getElementById(`picker-portal-role-picker-btn-${pickerOpen}`)
        : null
      const insidePortal = portalEl?.contains(e.target as Node) ?? false
      if (!insidePortal && pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(null); setPickerFilter('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerOpen])

  function getStartTimeISO() {
    if (!startDate || !startTime) return ''
    return new Date(`${startDate}T${startTime}:00Z`).toISOString()
  }

  function getRoleColor(roleName: string) {
    return guildRoles.find(r => r.name === roleName)?.category?.color ?? '#6b7280'
  }

  function applyTemplate(tpl: Template) {
    setParties(tpl.data.parties.map(p => ({
      name: p.name,
      roleSlots: p.slots.map(s => ({ roleName: s.roleName, color: getRoleColor(s.roleName), capacity: s.capacity, minIp: '', note: s.note ?? {} })),
    })))
  }

  function addParty() {
    setParties(prev => [...prev, { name: `Party ${prev.length + 1}`, roleSlots: [] }])
  }
  function removeParty(i: number) { setParties(prev => prev.filter((_, idx) => idx !== i)) }
  function updatePartyName(i: number, name: string) { setParties(prev => prev.map((p, idx) => idx === i ? { ...p, name } : p)) }

  function addSlot(pi: number, role: GuildRole) {
    setParties(prev => prev.map((p, i) => i === pi
      ? { ...p, roleSlots: [...p.roleSlots, { roleName: role.name, color: role.category?.color ?? '#6b7280', capacity: 1, minIp: '', note: {} }] }
      : p))
    setPickerOpen(null); setPickerFilter('')
  }
  function removeSlot(pi: number, si: number) { setParties(prev => prev.map((p, i) => i === pi ? { ...p, roleSlots: p.roleSlots.filter((_, j) => j !== si) } : p)) }
  function updateSlotField(pi: number, si: number, field: 'capacity' | 'minIp', value: string | number) {
    setParties(prev => prev.map((p, i) => i === pi ? { ...p, roleSlots: p.roleSlots.map((s, j) => j === si ? { ...s, [field]: value } : s) } : p))
  }
  function updateSlotNote(pi: number, si: number, note: SlotNote) {
    setParties(prev => prev.map((p, i) => i === pi ? { ...p, roleSlots: p.roleSlots.map((s, j) => j === si ? { ...s, note } : s) } : p))
  }

  async function doSubmit(status: 'DRAFT' | 'PUBLISHED') {
    if (!startDate || !startTime) { setError('Date and time are required'); return }
    setLoading(true); setError('')

    let fullDescription = description
    const extras: string[] = []
    if (siegeHammer) extras.push('⚔️ Siege Hammer')
    if (extraSets.trim()) extras.push(`Sets: 1+${extraSets.trim()}`)
    if (extras.length > 0) fullDescription = fullDescription ? `${fullDescription}\n\n${extras.join(' · ')}` : extras.join(' · ')

    try {
      const payload = { title, description: fullDescription, startTime: getStartTimeISO(), timezone: 'UTC', locationNote, status, visibility, guildSlug }
      let savedEventId = eventId

      if (!eventId) {
        const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error((await res.json()).error)
        const created = await res.json()
        savedEventId = created.id
        for (const party of parties) {
          await fetch(`/api/events/${savedEventId}/parties`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: party.name, roleSlots: party.roleSlots.filter(s => s.roleName).map(s => ({ roleName: s.roleName, capacity: Number(s.capacity), tags: [], minIp: s.minIp ? Number(s.minIp) : null, notes: serializeSlotNote(s.note ?? {}) })) }),
          })
        }
      } else {
        // 1. Update event metadata
        const res = await fetch(`/api/events/${eventId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error((await res.json()).error)

        // 2. Sync parties: for each party in the form...
        const existingEvent = await res.json()
        const existingPartyIds: string[] = existingEvent.parties?.map((p: any) => p.id) ?? []
        const formPartyIds = parties.filter(p => p.id).map(p => p.id!)

        // Delete parties that were removed
        for (const existingId of existingPartyIds) {
          if (!formPartyIds.includes(existingId)) {
            await fetch(`/api/events/${eventId}/parties`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ partyId: existingId }),
            })
          }
        }

        // Update existing or create new parties
        for (const party of parties) {
          const slots = party.roleSlots.filter(s => s.roleName).map(s => ({
            roleName: s.roleName, capacity: Number(s.capacity), tags: [],
            minIp: s.minIp ? Number(s.minIp) : null, notes: serializeSlotNote(s.note ?? {}),
          }))
          if (party.id) {
            // Update existing party's slots
            await fetch(`/api/events/${eventId}/parties`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ partyId: party.id, name: party.name, roleSlots: slots }),
            })
          } else {
            // Create new party
            await fetch(`/api/events/${eventId}/parties`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: party.name, roleSlots: slots }),
            })
          }
        }
      }

      const dest = guildSlug ? `/g/${guildSlug}/events/${savedEventId}` : `/events/${savedEventId}`
      router.push(dest)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const totalSlots = parties.reduce((a, p) => a + p.roleSlots.reduce((b, s) => b + s.capacity, 0), 0)


  return (
    <form onSubmit={e => e.preventDefault()} className="space-y-6">

      {/* Details */}
      <div className="card p-5 space-y-4">
        <h2 className="font-display font-600 text-text-primary text-sm tracking-tight">Content Details</h2>
        <div>
          <label className="label">Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="input" placeholder="ZvZ Crystal League — Saturday War" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="input resize-none" placeholder="Content briefing, requirements, IP floor..." />
        </div>

        {/* Date + Time — 24h, no AM/PM */}
        <div className="grid grid-cols-[1fr,160px] gap-3">
          <div>
            <label className="label">Date *</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="input" min={getTodayDate()} />
          </div>
          <div>
            <label className="label">
              Time UTC *
              <span className="ml-1 normal-case font-body tracking-normal text-text-muted text-xs">(24h)</span>
            </label>
            <div className="flex items-center gap-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 focus-within:border-accent/60 transition-colors">
              <input
                type="number"
                min={0} max={23}
                value={startTime.split(':')[0] ?? '00'}
                onChange={e => {
                  const h = Math.max(0, Math.min(23, Number(e.target.value)))
                  const m = startTime.split(':')[1] ?? '00'
                  setStartTime(`${String(h).padStart(2, '0')}:${m}`)
                }}
                className="w-10 bg-transparent text-center font-mono text-text-primary focus:outline-none text-sm"
                placeholder="HH"
              />
              <span className="text-text-muted font-mono">:</span>
              <input
                type="number"
                min={0} max={59} step={5}
                value={startTime.split(':')[1] ?? '00'}
                onChange={e => {
                  const m = Math.max(0, Math.min(59, Number(e.target.value)))
                  const h = startTime.split(':')[0] ?? '00'
                  setStartTime(`${h}:${String(m).padStart(2, '0')}`)
                }}
                className="w-10 bg-transparent text-center font-mono text-text-primary focus:outline-none text-sm"
                placeholder="MM"
              />
              <span className="text-text-muted text-xs font-mono ml-1">UTC</span>
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="label">Visibility</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisibility('MEMBERS_ONLY')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                visibility === 'MEMBERS_ONLY'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-elevated text-text-secondary hover:border-border-strong'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Members Only
            </button>
            <button
              type="button"
              onClick={() => setVisibility('PUBLIC')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                visibility === 'PUBLIC'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-border bg-bg-elevated text-text-secondary hover:border-border-strong'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Public
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1.5">
            {visibility === 'PUBLIC'
              ? 'Anyone with the event link can view and sign up (guests, members, alliance).'
              : 'Only guild members and alliance can view and sign up.'}
          </p>
        </div>

        {/* Siege Hammer + Sets */}
        <div className="flex items-center gap-6 flex-wrap">
          <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <div onClick={() => setSiegeHammer(v => !v)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${siegeHammer ? 'bg-accent border-accent' : 'border-border group-hover:border-border-strong bg-bg-elevated'}`}>
              {siegeHammer && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-sm text-text-primary">⚔️ Siege Hammer</span>
          </label>

          {/* Sets: 1 + [input] */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Sets:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg-elevated">
              <span className="text-sm font-mono text-text-primary">1</span>
              <span className="text-text-muted">+</span>
              <input
                type="number"
                min={0}
                max={9}
                value={extraSets}
                onChange={e => setExtraSets(e.target.value)}
                placeholder="0"
                className="w-10 bg-transparent text-sm font-mono text-text-primary text-center focus:outline-none"
              />
            </div>
            {extraSets && Number(extraSets) > 0 && (
              <span className="text-xs text-text-muted font-mono">= 1+{extraSets} sets</span>
            )}
          </div>
        </div>

        <div>
          <label className="label">Location / Voice Channel</label>
          <input type="text" value={locationNote} onChange={e => setLocationNote(e.target.value)} className="input" placeholder="Bridgewatch Portal · #zvz-staging" />
        </div>
      </div>

      {/* Builds (DB-driven) */}
      {!eventId && templates.length > 0 && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Build:</span>
            <div className="flex flex-wrap gap-2">
              {templates.map(tpl => (
                <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl)}
                  className="px-3 py-1.5 text-xs font-mono bg-bg-elevated border border-border-subtle text-text-secondary rounded-lg hover:border-accent/50 hover:text-accent transition-colors">
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parties */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-600 text-text-primary text-sm tracking-tight">
            Party Compositions
            <span className="ml-2 text-text-muted font-body font-normal text-xs">({totalSlots} slots)</span>
          </h2>
          <button type="button" onClick={addParty} className="btn-ghost text-xs">+ Add Party</button>
        </div>

        {parties.map((party, pi) => (
          <div key={pi} className="card">
            <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-3">
              <input type="text" value={party.name} onChange={e => updatePartyName(pi, e.target.value)}
                className="bg-transparent text-text-primary font-display font-600 text-sm focus:outline-none flex-1 min-w-0" />
              <span className="text-xs font-mono text-text-muted">{party.roleSlots.reduce((a, s) => a + s.capacity, 0)} slots</span>
              {parties.length > 1 && <button type="button" onClick={() => removeParty(pi)} className="btn-danger text-xs py-0.5 px-2">Remove</button>}
            </div>

            <div className="p-3">
              {party.roleSlots.length > 0 && (
                <div className="space-y-2 mb-3">
                  <div className="grid grid-cols-[1fr,60px,80px,28px,20px] gap-2 px-1 text-xs font-mono text-text-muted">
                    <span>Role</span><span className="text-center">Count</span><span>Min IP</span><span /><span />
                  </div>
                  {party.roleSlots.map((slot, si) => (
                    <div key={si}>
                      <div className="grid grid-cols-[1fr,60px,80px,28px,20px] gap-2 items-center">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium truncate"
                          style={{ backgroundColor: slot.color + '22', color: slot.color, border: `1px solid ${slot.color}44` }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: slot.color }} />
                          <span className="truncate">{slot.roleName}</span>
                          {hasNote(slot.note) && <span className="text-xs opacity-60 flex-shrink-0">📋</span>}
                        </div>
                        <input type="number" value={slot.capacity} min={1}
                          onChange={e => updateSlotField(pi, si, 'capacity', Number(e.target.value))}
                          className="input py-1.5 text-xs text-center" />
                        <input type="number" value={slot.minIp}
                          onChange={e => updateSlotField(pi, si, 'minIp', e.target.value)}
                          placeholder="1300" className="input py-1.5 text-xs" />
                        <button type="button"
                          onClick={() => setNoteOpen(noteOpen === `${pi}-${si}` ? null : `${pi}-${si}`)}
                          title="Build note"
                          className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${
                            hasNote(slot.note) ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-accent'
                          }`}
                        >📋</button>
                        <button type="button" onClick={() => removeSlot(pi, si)}
                          className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors rounded text-lg leading-none">×</button>
                      </div>
                      {noteOpen === `${pi}-${si}` && (
                        <div className="mt-2 ml-1 p-3 bg-bg-overlay rounded-lg border border-border-subtle">
                          <SlotNoteEditor
                            note={slot.note ?? {}}
                            onChange={n => updateSlotNote(pi, si, n)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Role picker — fixed position to escape any overflow:hidden parent */}
              <div className="relative" ref={pickerOpen === pi ? pickerRef : undefined}>
                <button
                  type="button"
                  id={`role-picker-btn-${pi}`}
                  onClick={e => {
                    if (pickerOpen === pi) { setPickerOpen(null); return }
                    setPickerFilter('')
                    setPickerOpen(pi)
                  }}
                  className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-text-muted hover:border-accent/50 hover:text-accent transition-all flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Role
                </button>

                {pickerOpen === pi && (
                  <PickerDropdown
                    anchorId={`role-picker-btn-${pi}`}
                    guildRoles={guildRoles}
                    guildCategories={guildCategories}
                    filter={pickerFilter}
                    onFilterChange={setPickerFilter}
                    onSelect={role => addSlot(pi, role)}
                    onClose={() => setPickerOpen(null)}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="button" disabled={loading} className="btn-secondary"
          onClick={() => doSubmit('DRAFT')}>
          {loading ? 'Saving…' : 'Save as Draft'}
        </button>
        <button type="button" disabled={loading} className="btn-primary"
          onClick={() => doSubmit('PUBLISHED')}>
          {loading ? 'Publishing…' : 'Publish Event'}
        </button>
      </div>
    </form>
  )
}
