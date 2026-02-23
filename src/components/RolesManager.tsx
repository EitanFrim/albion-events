'use client'

import { useState, useRef, useEffect } from 'react'
import { RoleSpecialistsPanel } from '@/components/RoleSpecialistsPanel'

export interface GuildCategory {
  id: string
  name: string
  color: string
  displayOrder: number
}

export interface GuildRole {
  id: string
  name: string
  categoryId: string | null
  category: GuildCategory | null
}

const PRESET_COLORS = [
  '#60a5fa', '#34d399', '#a78bfa', '#f87171', '#fbbf24',
  '#94a3b8', '#2dd4bf', '#fb923c', '#e879f9', '#a3e635',
  '#38bdf8', '#f472b6', '#facc15', '#4ade80', '#818cf8',
]

interface Props {
  initialCategories: GuildCategory[]
  initialRoles: GuildRole[]
  onPick?: (role: GuildRole) => void
  compact?: boolean
  guildSlug?: string
}

export function RolesManager({ initialCategories, initialRoles, onPick, compact = false, guildSlug }: Props) {
  const [categories, setCategories] = useState<GuildCategory[]>(initialCategories)
  const [roles, setRoles] = useState<GuildRole[]>(initialRoles)

  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#60a5fa')
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatColor, setEditCatColor] = useState('')

  const [showAddRole, setShowAddRole] = useState<string | null>(null) // categoryId or 'none'
  const [newRoleName, setNewRoleName] = useState('')
  const [roleLoading, setRoleLoading] = useState(false)
  const [roleError, setRoleError] = useState('')

  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const roleInputRef = useRef<HTMLInputElement>(null)
  const catInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (showAddRole !== null) setTimeout(() => roleInputRef.current?.focus(), 50) }, [showAddRole])
  useEffect(() => { if (showAddCat) setTimeout(() => catInputRef.current?.focus(), 50) }, [showAddCat])

  const rolesByCat = (catId: string | null) => roles.filter(r => r.categoryId === catId)

  async function addCategory() {
    if (!newCatName.trim()) { setCatError('Enter a name'); return }
    setCatLoading(true); setCatError('')
    try {
      const res = await fetch('/api/guild-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName.trim(), color: newCatColor, guildSlug }) })
      if (!res.ok) throw new Error((await res.json()).error)
      const cat: GuildCategory = await res.json()
      setCategories(prev => [...prev, cat])
      setNewCatName(''); setShowAddCat(false)
    } catch (e: any) { setCatError(e.message) }
    finally { setCatLoading(false) }
  }

  async function saveEditCat(id: string) {
    const res = await fetch(`/api/guild-categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editCatName.trim(), color: editCatColor }) })
    if (res.ok) {
      const updated: GuildCategory = await res.json()
      setCategories(prev => prev.map(c => c.id === id ? updated : c))
      setRoles(prev => prev.map(r => r.categoryId === id ? { ...r, category: updated } : r))
      setEditingCatId(null)
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Roles in it will become uncategorized.')) return
    await fetch(`/api/guild-categories/${id}`, { method: 'DELETE' })
    setCategories(prev => prev.filter(c => c.id !== id))
    setRoles(prev => prev.map(r => r.categoryId === id ? { ...r, categoryId: null, category: null } : r))
  }

  async function addRole(categoryId: string | null) {
    if (!newRoleName.trim()) { setRoleError('Enter a name'); return }
    setRoleLoading(true); setRoleError('')
    try {
      const res = await fetch('/api/guild-roles2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newRoleName.trim(), categoryId, guildSlug }) })
      if (!res.ok) throw new Error((await res.json()).error)
      const role: GuildRole = await res.json()
      setRoles(prev => [...prev, role])
      setNewRoleName(''); setRoleError(''); setShowAddRole(null)
      if (onPick) onPick(role)
    } catch (e: any) { setRoleError(e.message) }
    finally { setRoleLoading(false) }
  }

  async function deleteRole(id: string) {
    if (!confirm('Delete this role?')) return
    await fetch(`/api/guild-roles2/${id}`, { method: 'DELETE' })
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  function exportRoles() {
    const data = {
      type: 'albion-events-roles',
      categories: categories.map(c => ({ name: c.name, color: c.color, displayOrder: c.displayOrder })),
      roles: roles.map(r => ({ name: r.name, category: r.category?.name ?? null })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'roles-export.json'; a.click()
    URL.revokeObjectURL(url)
  }

  async function importRoles(file: File) {
    setImporting(true); setImportMsg('')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.type !== 'albion-events-roles') throw new Error('Invalid file format')
      if (!Array.isArray(data.categories) || !Array.isArray(data.roles)) throw new Error('Invalid file structure')

      let created = 0, skipped = 0
      const catMap = new Map<string, string>() // name → new id

      // Create categories first
      for (const cat of data.categories) {
        const existing = categories.find(c => c.name === cat.name)
        if (existing) { catMap.set(cat.name, existing.id); skipped++; continue }
        const res = await fetch('/api/guild-categories', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat.name, color: cat.color ?? '#6b7280', guildSlug }),
        })
        if (res.ok) {
          const newCat: GuildCategory = await res.json()
          setCategories(prev => [...prev, newCat])
          catMap.set(cat.name, newCat.id)
          created++
        } else { skipped++ }
      }

      // Create roles
      for (const role of data.roles) {
        const existing = roles.find(r => r.name === role.name)
        if (existing) { skipped++; continue }
        const categoryId = role.category ? catMap.get(role.category) ?? null : null
        const res = await fetch('/api/guild-roles2', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: role.name, categoryId, guildSlug }),
        })
        if (res.ok) {
          const newRole: GuildRole = await res.json()
          setRoles(prev => [...prev, newRole])
          created++
        } else { skipped++ }
      }

      setImportMsg(`Imported ${created} items${skipped > 0 ? `, ${skipped} skipped (already exist)` : ''}`)
    } catch (e: any) {
      setImportMsg(`Error: ${e.message}`)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const uncategorized = rolesByCat(null)

  function renderRoleList(catId: string | null, color: string, sectionKey: string) {
    const catRoles = rolesByCat(catId)
    return (
      <div className="p-3">
        {compact ? (
          // Compact mode: flat chips (for picker)
          <div className="flex flex-wrap gap-2 mb-2 min-h-6">
            {catRoles.map(role => (
              <div key={role.id} className="group flex items-center gap-0.5">
                <button
                  onClick={() => onPick ? onPick(role) : undefined}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-all hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: color + '22', color, border: `1px solid ${color}55` }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  {role.name}
                </button>
              </div>
            ))}
            {catRoles.length === 0 && <span className="text-xs text-text-muted italic">No roles yet</span>}
          </div>
        ) : (
          // Full mode: each role as a row with specialists
          <div className="space-y-2 mb-2">
            {catRoles.map(role => (
              <div key={role.id} className="group rounded-lg border border-border-subtle bg-bg-overlay p-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 flex-1 px-2 py-1 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span>{role.name}</span>
                  </div>
                  <button onClick={() => deleteRole(role.id)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-red-400 hover:bg-red-950/30 transition-all flex-shrink-0">
                    ×
                  </button>
                </div>
                <div className="mt-2 ml-1">
                  <RoleSpecialistsPanel roleId={role.id} roleName={role.name} color={color} guildSlug={guildSlug} />
                </div>
              </div>
            ))}
            {catRoles.length === 0 && <span className="text-xs text-text-muted italic">No roles yet</span>}
          </div>
        )}

        {showAddRole === sectionKey ? (
          <div className="flex items-center gap-2">
            <input ref={roleInputRef} type="text" value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addRole(catId); if (e.key === 'Escape') { setShowAddRole(null); setNewRoleName('') } }}
              placeholder="Role name..." className="input text-sm py-1.5 flex-1" maxLength={64} />
            <button onClick={() => addRole(catId)} disabled={roleLoading} className="btn-primary text-xs py-1.5">
              {onPick ? 'Add & Pick' : 'Add'}
            </button>
            <button onClick={() => { setShowAddRole(null); setNewRoleName(''); setRoleError('') }} className="btn-ghost text-xs py-1.5">✕</button>
          </div>
        ) : (
          <button onClick={() => { setShowAddRole(sectionKey); setNewRoleName('') }}
            className="text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add role
          </button>
        )}
        {roleError && showAddRole === sectionKey && <p className="text-red-400 text-xs mt-1">{roleError}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Categories */}
      {categories.map(cat => (
        <div key={cat.id} className="card overflow-hidden">
          {editingCatId === cat.id ? (
            <div className="px-4 py-3 border-b border-border-subtle flex flex-wrap items-center gap-3">
              <input type="text" value={editCatName} onChange={e => setEditCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEditCat(cat.id); if (e.key === 'Escape') setEditingCatId(null) }}
                className="input text-sm py-1 w-40" autoFocus />
              <div className="flex gap-1 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setEditCatColor(c)}
                    className={`w-5 h-5 rounded transition-all ${editCatColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-bg-surface scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }} />
                ))}
                <label className="relative w-5 h-5 rounded overflow-hidden cursor-pointer border border-dashed border-border">
                  <input type="color" value={editCatColor} onChange={e => setEditCatColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </label>
              </div>
              <button onClick={() => saveEditCat(cat.id)} className="btn-primary text-xs py-1">Save</button>
              <button onClick={() => setEditingCatId(null)} className="btn-ghost text-xs">Cancel</button>
            </div>
          ) : (
            <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-3 group">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="font-display font-600 text-text-primary text-sm flex-1">{cat.name}</span>
              <span className="text-xs text-text-muted font-mono">{rolesByCat(cat.id).length}</span>
              {!compact && (
                <div className="hidden group-hover:flex gap-1">
                  <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); setEditCatColor(cat.color) }} className="btn-ghost text-xs py-0.5 px-2">Edit</button>
                  <button onClick={() => deleteCategory(cat.id)} className="btn-danger text-xs py-0.5 px-2">Delete</button>
                </div>
              )}
            </div>
          )}
          {renderRoleList(cat.id, cat.color, cat.id)}
        </div>
      ))}

      {/* Uncategorized */}
      {(uncategorized.length > 0 || !compact) && (
        <div className="card overflow-hidden border-dashed border-border">
          <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-text-muted flex-shrink-0" />
            <span className="font-display font-600 text-text-muted text-sm flex-1">Uncategorized</span>
            <span className="text-xs text-text-muted font-mono">{uncategorized.length}</span>
          </div>
          {renderRoleList(null, '#6b7280', 'none')}
        </div>
      )}

      {/* Add category button */}
      {!compact && (
        showAddCat ? (
          <div className="card p-4 space-y-3 border-accent/20">
            <p className="text-xs font-mono text-text-muted uppercase tracking-wider">New Category</p>
            <div className="flex items-center gap-3">
              <input ref={catInputRef} type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') setShowAddCat(false) }}
                placeholder="Category name..." className="input flex-1" />
              <span className="w-7 h-7 rounded-full flex-shrink-0 border-2 border-white/20" style={{ backgroundColor: newCatColor }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setNewCatColor(c)}
                  className={`w-6 h-6 rounded-md transition-all ${newCatColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-surface scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <label className="relative w-6 h-6 rounded-md border border-dashed border-border cursor-pointer overflow-hidden flex items-center justify-center text-text-muted text-xs">
                <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                ✎
              </label>
            </div>
            {catError && <p className="text-red-400 text-xs">{catError}</p>}
            <div className="flex gap-2">
              <button onClick={addCategory} disabled={catLoading} className="btn-primary text-xs">{catLoading ? 'Adding…' : 'Add Category'}</button>
              <button onClick={() => { setShowAddCat(false); setNewCatName(''); setCatError('') }} className="btn-ghost text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddCat(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-border text-text-muted hover:border-accent/50 hover:text-accent transition-all text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Category
          </button>
        )
      )}

      {/* Export / Import */}
      {!compact && (
        <div className="flex items-center gap-3 pt-2 border-t border-border-subtle">
          <button onClick={exportRoles} className="btn-ghost text-xs flex items-center gap-1.5"
            disabled={categories.length === 0 && roles.length === 0}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
            Export Roles
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) importRoles(f) }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="btn-ghost text-xs flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 6l-4-4-4 4M12 2v13" /></svg>
            {importing ? 'Importing…' : 'Import Roles'}
          </button>
          {importMsg && <span className={`text-xs ${importMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{importMsg}</span>}
        </div>
      )}
    </div>
  )
}
