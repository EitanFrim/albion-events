'use client'

import { useState, useRef, useEffect } from 'react'
import type { GuildCategory, GuildRole } from '@/components/RolesManager'
import { SlotNoteEditor, type SlotNote, parseSlotNote, serializeSlotNote, hasNote } from '@/components/SlotNoteEditor'
import { RoleNoteButton } from '@/components/RoleNoteButton'

interface TemplateSlot { roleName: string; capacity: number; note?: SlotNote }
interface TemplateParty { name: string; slots: TemplateSlot[] }
interface Template { id: string; name: string; data: { parties: TemplateParty[] } }

interface Props {
  initialTemplates: Template[]
  initialCategories: GuildCategory[]
  initialRoles: GuildRole[]
  guildSlug?: string
  readonly?: boolean
}

export function TemplatesManager({ initialTemplates, initialCategories, initialRoles, guildSlug, readonly }: Props) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  function startCreate() {
    setEditing({ id: '', name: '', data: { parties: [{ name: 'Party 1', slots: [] }] } })
    setCreating(true)
  }

  function startEdit(tpl: Template) {
    setEditing(JSON.parse(JSON.stringify(tpl)))
    setCreating(false)
  }

  function handleSaved(saved: Template, wasCreating: boolean) {
    setTemplates(prev => wasCreating ? [...prev, saved] : prev.map(t => t.id === saved.id ? saved : t))
    setCreating(false)
    setEditing(null)
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this build?')) return
    await fetch(`/api/guild-templates/${id}`, { method: 'DELETE' })
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  if (editing) {
    return (
      <TemplateEditor
        template={editing}
        roles={initialRoles}
        categories={initialCategories}
        onChange={setEditing}
        onSaved={handleSaved}
        onCancel={() => { setCreating(false); setEditing(null) }}
        isNew={creating}
        guildSlug={guildSlug}
      />
    )
  }

  // ── Read-only view for players ──────────────────────────────────
  if (readonly) {
    return (
      <div className="space-y-3">
        {templates.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-text-muted text-sm">No builds have been created yet.</p>
          </div>
        )}
        {templates.map(tpl => {
          const totalSlots = tpl.data.parties.reduce((a, p) => a + p.slots.reduce((b, s) => b + s.capacity, 0), 0)
          const isOpen = expanded === tpl.id
          return (
            <div key={tpl.id} className="card overflow-hidden">
              {/* Header — always visible, click to expand */}
              <button
                onClick={() => setExpanded(isOpen ? null : tpl.id)}
                className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-bg-elevated transition-colors"
              >
                <div>
                  <p className="font-display font-600 text-text-primary">{tpl.name}</p>
                  <p className="text-xs text-text-muted font-mono mt-0.5">
                    {tpl.data.parties.length} {tpl.data.parties.length === 1 ? 'party' : 'parties'} · {totalSlots} slots
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-text-muted transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded party/slot view */}
              {isOpen && (
                <div className="border-t border-border-subtle px-4 pb-6 pt-3">
                  <div className="flex gap-3 overflow-x-auto pb-48">
                    {tpl.data.parties.map((party, pi) => (
                      <div key={pi} className="flex-shrink-0 w-44 rounded-xl border border-border bg-bg-overlay">
                        <div className="px-3 py-2 border-b border-border-subtle rounded-t-xl bg-bg-elevated">
                          <span className="font-display font-600 text-text-primary text-xs tracking-wide">{party.name}</span>
                          <span className="text-xs font-mono text-text-muted ml-2">
                            {party.slots.reduce((a, s) => a + s.capacity, 0)} slots
                          </span>
                        </div>
                        <div className="p-2 space-y-0.5">
                          {party.slots.map((slot, si) => {
                            const role = initialRoles.find(r => r.name === slot.roleName)
                            const color = role?.category?.color ?? '#6b7280'
                            return (
                              <div
                                key={si}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                                style={{ backgroundColor: color + '18', borderLeft: `2px solid ${color}` }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                <span className="font-mono font-600 truncate" style={{ color }}>{slot.roleName}</span>
                                {slot.capacity > 1 && (
                                  <span className="ml-auto font-mono text-text-muted flex-shrink-0">×{slot.capacity}</span>
                                )}
                                {hasNote(slot.note) && (
                                  <RoleNoteButton rawNote={serializeSlotNote(slot.note ?? {})} roleName={slot.roleName} color={color} />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {templates.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-text-muted text-sm">No builds yet. Create one to speed up event setup.</p>
        </div>
      )}

      {templates.map(tpl => {
        const totalSlots = tpl.data.parties.reduce((a, p) => a + p.slots.reduce((b, s) => b + s.capacity, 0), 0)
        return (
          <div key={tpl.id} className="card p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-display font-600 text-text-primary mb-1">{tpl.name}</p>
              <p className="text-xs text-text-muted font-mono">
                {tpl.data.parties.length} {tpl.data.parties.length === 1 ? 'party' : 'parties'} · {totalSlots} slots
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {tpl.data.parties.map((p, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-muted font-mono">
                    {p.name} ({p.slots.length})
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => startEdit(tpl)} className="btn-ghost text-xs">Edit</button>
              <button onClick={() => deleteTemplate(tpl.id)} className="btn-danger text-xs">Delete</button>
            </div>
          </div>
        )
      })}

      <button onClick={startCreate}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-border text-text-muted hover:border-accent/50 hover:text-accent transition-all text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        New Template
      </button>
    </div>
  )
}


// Groups roles by category for sorted display
function groupRolesByCategory(roles: GuildRole[], categories: GuildCategory[]) {
  const groups: { category: GuildCategory | null; roles: GuildRole[] }[] = []
  
  // Add categorized groups in category order
  for (const cat of categories) {
    const catRoles = roles.filter(r => r.categoryId === cat.id)
    if (catRoles.length > 0) groups.push({ category: cat, roles: catRoles })
  }
  
  // Uncategorized at end
  const uncategorized = roles.filter(r => r.categoryId === null)
  if (uncategorized.length > 0) groups.push({ category: null, roles: uncategorized })
  
  return groups
}

function RolePicker({ roles, categories, onSelect, onClose }: {
  roles: GuildRole[]
  categories: GuildCategory[]
  onSelect: (roleName: string) => void
  onClose: () => void
}) {
  const [filter, setFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => { inputRef.current?.focus() }, [])
  
  const filteredRoles = filter
    ? roles.filter(r => r.name.toLowerCase().includes(filter.toLowerCase()))
    : roles

  const groups = groupRolesByCategory(filteredRoles, categories)

  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-lg overflow-hidden" style={{ minWidth: 220 }}>
      <div className="p-2 border-b border-border-subtle">
        <input ref={inputRef} type="text" value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Search roles..." className="input text-xs py-1.5"
          onKeyDown={e => e.key === 'Escape' && onClose()} />
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {groups.length === 0 && <p className="text-xs text-text-muted text-center py-3">No roles found</p>}
        {groups.map((group, gi) => (
          <div key={gi}>
            <div className="px-3 py-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.category?.color ?? '#6b7280' }} />
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                {group.category?.name ?? 'Uncategorized'}
              </span>
            </div>
            {group.roles.map(role => {
              const color = role.category?.color ?? '#6b7280'
              return (
                <button key={role.id} onClick={() => onSelect(role.name)}
                  className="w-full flex items-center gap-2.5 px-4 py-1.5 hover:bg-bg-overlay text-left transition-colors">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm text-text-primary">{role.name}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-border-subtle p-1">
        <button onClick={onClose} className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-1.5">Close</button>
      </div>
    </div>
  )
}

function TemplateEditor({ template, roles, categories, onChange, onSaved, onCancel, isNew, guildSlug }: {
  template: Template; roles: GuildRole[]; categories: GuildCategory[]
  onChange: (t: Template) => void
  onSaved: (saved: Template, wasCreating: boolean) => void
  onCancel: () => void; isNew: boolean; guildSlug?: string
}) {
  const [pickerOpen, setPickerOpen] = useState<number | null>(null)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [noteOpen, setNoteOpen] = useState<string | null>(null) // `${pi}-${si}`
  const pickerRefs = useRef<(HTMLDivElement | null)[]>([])

  // Drag state: { partyIndex, slotIndex being dragged, slot index being hovered over }
  const dragRef = useRef<{ pi: number; from: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ pi: number; si: number } | null>(null)

  // Save reads directly from `template` prop — no stale closure
  async function handleSave() {
    if (!template.name.trim()) { setSaveError('Build name is required'); return }
    setSaving(true); setSaveError('')
    try {
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/guild-templates' : `/api/guild-templates/${template.id}`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: template.name.trim(), data: template.data, guildSlug }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSaveError(err.error ?? `Save failed (${res.status})`)
        return
      }
      const saved: Template = await res.json()
      onSaved(saved, isNew)
    } catch (e: any) {
      setSaveError(e.message ?? 'Network error')
    } finally {
      setSaving(false)
    }
  }

  // Close picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerOpen === null) return
      const ref = pickerRefs.current[pickerOpen]
      if (ref && !ref.contains(e.target as Node)) setPickerOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  function updatePartyName(pi: number, name: string) {
    const p = [...template.data.parties]; p[pi] = { ...p[pi], name }
    onChange({ ...template, data: { parties: p } })
  }

  function addParty() {
    onChange({ ...template, data: { parties: [...template.data.parties, { name: `Party ${template.data.parties.length + 1}`, slots: [] }] } })
  }

  function removeParty(pi: number) {
    onChange({ ...template, data: { parties: template.data.parties.filter((_, i) => i !== pi) } })
  }

  function addSlot(pi: number, roleName: string) {
    const p = [...template.data.parties]
    p[pi] = { ...p[pi], slots: [...p[pi].slots, { roleName, capacity: 1 }] }
    onChange({ ...template, data: { parties: p } })
    setPickerOpen(null)
  }

  function removeSlot(pi: number, si: number) {
    const p = [...template.data.parties]
    p[pi] = { ...p[pi], slots: p[pi].slots.filter((_, j) => j !== si) }
    onChange({ ...template, data: { parties: p } })
  }

  function updateCapacity(pi: number, si: number, cap: number) {
    const p = [...template.data.parties]
    const slots = [...p[pi].slots]; slots[si] = { ...slots[si], capacity: cap }
    p[pi] = { ...p[pi], slots }
    onChange({ ...template, data: { parties: p } })
  }

  function updateNote(pi: number, si: number, note: SlotNote) {
    const p = [...template.data.parties]
    const slots = [...p[pi].slots]; slots[si] = { ...slots[si], note }
    p[pi] = { ...p[pi], slots }
    onChange({ ...template, data: { parties: p } })
  }

  function reorderSlot(pi: number, from: number, to: number) {
    if (from === to) return
    const p = [...template.data.parties]
    const slots = [...p[pi].slots]
    const [moved] = slots.splice(from, 1)
    slots.splice(to, 0, moved)
    p[pi] = { ...p[pi], slots }
    onChange({ ...template, data: { parties: p } })
  }

  function getRoleColor(roleName: string) {
    return roles.find(r => r.name === roleName)?.category?.color ?? '#6b7280'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="btn-ghost text-xs">← Back</button>
        <h2 className="font-display font-600 text-text-primary">{isNew ? 'New Build' : 'Edit Build'}</h2>
      </div>

      <div className="card p-4">
        <label className="label">Template Name *</label>
        <input type="text" value={template.name} onChange={e => onChange({ ...template, name: e.target.value })}
          placeholder="e.g. Standard ZvZ 20v20" className="input" autoFocus />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-display font-600 text-text-primary">Parties</span>
          <button onClick={addParty} className="btn-ghost text-xs">+ Add Party</button>
        </div>

        {template.data.parties.map((party, pi) => (
          <div key={pi} className="card p-0 rounded-xl border border-border">
            {/* Party header */}
            <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-3 rounded-t-xl bg-bg-elevated">
              <input type="text" value={party.name} onChange={e => updatePartyName(pi, e.target.value)}
                className="bg-transparent text-text-primary font-display font-600 text-sm focus:outline-none flex-1" />
              <span className="text-xs font-mono text-text-muted">{party.slots.reduce((a, s) => a + s.capacity, 0)} slots</span>
              {template.data.parties.length > 1 && (
                <button onClick={() => removeParty(pi)} className="btn-danger text-xs py-0.5 px-2">Remove</button>
              )}
            </div>

            {/* Draggable slot list */}
            <div className="p-3 space-y-1">
              {party.slots.map((slot, si) => {
                const color = getRoleColor(slot.roleName)
                const isDraggingThis = dragRef.current?.pi === pi && dragRef.current?.from === si
                const isDropTarget = dragOver?.pi === pi && dragOver?.si === si && !isDraggingThis

                return (
                  <div
                    key={`${slot.roleName}-${si}`}
                    draggable
                    onDragStart={e => {
                      dragRef.current = { pi, from: si }
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setDragImage(e.currentTarget, 20, 20)
                    }}
                    onDragOver={e => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setDragOver({ pi, si })
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={e => {
                      e.preventDefault()
                      if (dragRef.current && dragRef.current.pi === pi) {
                        reorderSlot(pi, dragRef.current.from, si)
                      }
                      dragRef.current = null
                      setDragOver(null)
                    }}
                    onDragEnd={() => {
                      dragRef.current = null
                      setDragOver(null)
                    }}
                    className={`rounded-lg transition-all select-none border
                      ${isDraggingThis ? 'opacity-30' : 'opacity-100'}
                      ${isDropTarget ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg-surface' : 'border-transparent'}
                    `}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-2">
                      {/* Drag handle */}
                      <div className="cursor-grab active:cursor-grabbing flex-shrink-0 px-1 py-2 text-text-muted/40 hover:text-text-muted transition-colors"
                        title="Drag to reorder">
                        <svg className="w-3.5 h-4" viewBox="0 0 10 16" fill="currentColor">
                          <circle cx="3" cy="3" r="1.5" /><circle cx="7" cy="3" r="1.5" />
                          <circle cx="3" cy="8" r="1.5" /><circle cx="7" cy="8" r="1.5" />
                          <circle cx="3" cy="13" r="1.5" /><circle cx="7" cy="13" r="1.5" />
                        </svg>
                      </div>

                      {/* Role chip */}
                      <div className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg border text-sm"
                        style={{ backgroundColor: color + '22', borderColor: color + '55', color }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-medium flex-1 truncate">{slot.roleName}</span>
                        {hasNote(slot.note) && (
                          <span className="text-xs opacity-60 flex-shrink-0" title="Has build note">📋</span>
                        )}
                      </div>

                      {/* Capacity */}
                      <input
                        type="number" min={1} value={slot.capacity}
                        onChange={e => updateCapacity(pi, si, Number(e.target.value))}
                        onMouseDown={e => e.stopPropagation()}
                        className="input w-14 text-center text-sm py-1.5 flex-shrink-0"
                      />

                      {/* Note toggle */}
                      <button
                        onClick={() => setNoteOpen(noteOpen === `${pi}-${si}` ? null : `${pi}-${si}`)}
                        onMouseDown={e => e.stopPropagation()}
                        title="Add build note"
                        className={`w-7 h-7 flex items-center justify-center rounded transition-colors text-sm flex-shrink-0 ${
                          hasNote(slot.note) ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-accent'
                        }`}
                      >📋</button>

                      {/* Remove */}
                      <button
                        onClick={() => removeSlot(pi, si)}
                        onMouseDown={e => e.stopPropagation()}
                        className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors text-lg flex-shrink-0"
                      >×</button>
                    </div>

                    {/* Structured note editor — expands when toggled */}
                    {noteOpen === `${pi}-${si}` && (
                      <div className="mt-2 ml-8 mr-2 mb-2 p-3 bg-bg-overlay rounded-lg border border-border-subtle" onMouseDown={e => e.stopPropagation()}>
                        <SlotNoteEditor
                          note={slot.note ?? {}}
                          onChange={n => updateNote(pi, si, n)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Drop indicator when dragging over empty space */}
              {dragRef.current?.pi === pi && party.slots.length > 0 && (
                <div className="h-0.5 rounded-full bg-accent/30 mx-2" />
              )}

              {/* Add Role picker */}
              <div className="relative mt-1.5" ref={el => { pickerRefs.current[pi] = el }}>
                <button
                  onClick={() => setPickerOpen(pickerOpen === pi ? null : pi)}
                  className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-text-muted hover:border-accent/50 hover:text-accent transition-all flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Role
                </button>
                {pickerOpen === pi && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50">
                    <RolePicker
                      roles={roles}
                      categories={categories}
                      onSelect={name => addSlot(pi, name)}
                      onClose={() => setPickerOpen(null)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {saveError && <p className="text-red-400 text-sm">{saveError}</p>}

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving || !template.name.trim()} className="btn-primary">
          {saving ? 'Saving…' : isNew ? 'Create Template' : 'Save Changes'}
        </button>
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </div>
  )
}
