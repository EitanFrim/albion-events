'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  guild: { id: string; name: string; slug: string; inviteCode: string; description: string | null; logoUrl: string | null; discordGuildId: string | null; discordMemberRoleId: string | null; discordAllianceRoleId: string | null; discordBotInstalled: boolean }
}

export function GuildSettingsPanel({ guild }: Props) {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState(guild.inviteCode)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(guild.name)
  const [guildName, setGuildName] = useState(guild.name)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState('')
  const [logoUrl, setLogoUrl] = useState(guild.logoUrl ?? '')
  const [logoSaving, setLogoSaving] = useState(false)
  const [logoError, setLogoError] = useState('')
  const [logoSaved, setLogoSaved] = useState(false)
  const [discordLinked, setDiscordLinked] = useState(guild.discordBotInstalled)
  const [unlinking, setUnlinking] = useState(false)

  async function saveLogo(url: string) {
    setLogoSaving(true); setLogoError(''); setLogoSaved(false)
    const res = await fetch(`/api/guilds/${guild.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoUrl: url }),
    })
    setLogoSaving(false)
    if (res.ok) { setLogoSaved(true); setTimeout(() => setLogoSaved(false), 2000); router.refresh() }
    else { const d = await res.json(); setLogoError(d.error ?? 'Save failed') }
  }

  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const inviteLink = `${origin}/guilds/join/${inviteCode}`

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function regenerate() {
    if (!confirm('Regenerate invite code? The old link will stop working.')) return
    setRegenerating(true)
    try {
      const res = await fetch(`/api/guilds/${guild.slug}/invite`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setInviteCode(data.inviteCode)
      }
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Invite code card */}
      <div className="card p-5 space-y-4">
        <div>
          <h2 className="font-display font-600 text-text-primary mb-1">Invite Members</h2>
          <p className="text-text-secondary text-sm">Share this link or code to invite players to your guild. They'll be pending until an officer verifies them.</p>
        </div>

        <div className="space-y-3">
          {/* Code display */}
          <div className="flex items-center gap-3 bg-bg-overlay border border-border rounded-lg p-3">
            <span className="font-mono text-2xl font-700 text-accent tracking-[0.3em] flex-1 text-center">
              {inviteCode}
            </span>
          </div>

          {/* Invite link */}
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-text-muted bg-bg-overlay border border-border rounded px-2 py-1.5 truncate font-mono">
              {inviteLink}
            </code>
            <button onClick={copyInvite} className={`btn-primary text-xs flex-shrink-0 ${copied ? 'bg-emerald-600' : ''}`}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <button onClick={regenerate} disabled={regenerating} className="btn-ghost text-xs text-red-400/70 hover:text-red-400">
          {regenerating ? 'Regenerating…' : '↺ Regenerate code (invalidates old link)'}
        </button>
      </div>

      {/* Guild info */}
      <div className="card p-5">
        <h2 className="font-display font-600 text-text-primary mb-3">Guild Info</h2>
        <div className="space-y-3 text-sm">

          {/* Name row — editable */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-text-muted flex-shrink-0">Name</span>
            {editingName ? (
              <div className="flex items-center gap-2 flex-1 justify-end">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => { setNameInput(e.target.value); setNameError('') }}
                  maxLength={64}
                  className="input text-sm py-1 w-40"
                  autoFocus
                  onKeyDown={async e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (!nameInput.trim() || nameInput.trim().length < 2) { setNameError('Min 2 characters'); return }
                      setNameSaving(true); setNameError('')
                      const res = await fetch(`/api/guilds/${guild.slug}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: nameInput.trim() }),
                      })
                      setNameSaving(false)
                      if (res.ok) { setGuildName(nameInput.trim()); setEditingName(false); router.refresh() }
                      else { const d = await res.json(); setNameError(d.error ?? 'Save failed') }
                    }
                    if (e.key === 'Escape') { setEditingName(false); setNameInput(guildName) }
                  }}
                />
                <button
                  disabled={nameSaving}
                  onClick={async () => {
                    if (!nameInput.trim() || nameInput.trim().length < 2) { setNameError('Min 2 characters'); return }
                    setNameSaving(true); setNameError('')
                    const res = await fetch(`/api/guilds/${guild.slug}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: nameInput.trim() }),
                    })
                    setNameSaving(false)
                    if (res.ok) { setGuildName(nameInput.trim()); setEditingName(false); router.refresh() }
                    else { const d = await res.json(); setNameError(d.error ?? 'Save failed') }
                  }}
                  className="btn-primary text-xs py-1 px-2.5 flex-shrink-0"
                >
                  {nameSaving ? '…' : 'Save'}
                </button>
                <button onClick={() => { setEditingName(false); setNameInput(guildName) }} className="btn-ghost text-xs py-1 px-2">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-text-primary font-medium">{guildName}</span>
                <button onClick={() => { setEditingName(true); setNameInput(guildName) }} className="text-text-muted hover:text-accent transition-colors" title="Edit name">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          {nameError && <p className="text-red-400 text-xs text-right">{nameError}</p>}

          {/* Logo row */}
          <div className="pt-2 border-t border-border-subtle space-y-2">
            <span className="text-text-muted text-sm block">Guild Icon</span>
            <div className="flex items-center gap-3">
              {/* Preview */}
              <div className="w-12 h-12 rounded-xl border border-border bg-bg-overlay flex items-center justify-center flex-shrink-0 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-cover" onError={() => setLogoUrl('')} />
                ) : (
                  <span className="text-2xl">⚔️</span>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => { setLogoUrl(e.target.value); setLogoSaved(false) }}
                  placeholder="https://i.imgur.com/yourimage.png"
                  className="input text-xs py-1.5 w-full"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveLogo(logoUrl)}
                    disabled={logoSaving}
                    className="btn-primary text-xs py-1 px-2.5"
                  >
                    {logoSaving ? '…' : logoSaved ? '✓ Saved' : 'Save Icon'}
                  </button>
                  {logoUrl && (
                    <button
                      onClick={() => { setLogoUrl(''); saveLogo('') }}
                      className="btn-ghost text-xs py-1 px-2 text-text-muted"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {logoError && <p className="text-red-400 text-xs">{logoError}</p>}
                <p className="text-xs text-text-muted">Paste a direct image URL (Imgur, Discord CDN, etc.)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">URL</span>
            <span className="text-text-muted font-mono text-xs">/g/{guild.slug}</span>
          </div>
          {guild.description && (
            <div className="pt-2 border-t border-border-subtle">
              <span className="text-text-muted block mb-1">Description</span>
              <p className="text-text-secondary text-xs">{guild.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Discord bot integration */}
      <div className="card p-5 space-y-4">
        <div>
          <h2 className="font-display font-600 text-text-primary mb-1">Discord Bot</h2>
          <p className="text-text-secondary text-sm">
            Connect a Discord bot so players can self-register with <code className="text-accent">/register</code> in your Discord server.
          </p>
        </div>

        {discordLinked ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-emerald-400 font-medium">Connected</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Discord Server ID</span>
                <span className="text-text-secondary font-mono text-xs">{guild.discordGuildId ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Member Role ID</span>
                <span className="text-text-secondary font-mono text-xs">{guild.discordMemberRoleId ?? 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Alliance Role ID</span>
                <span className="text-text-secondary font-mono text-xs">{guild.discordAllianceRoleId ?? 'Not set'}</span>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!confirm('Unlink Discord server? Players will no longer be able to use /register.')) return
                setUnlinking(true)
                try {
                  const res = await fetch(`/api/guilds/${guild.slug}/discord`, { method: 'DELETE' })
                  if (res.ok) { setDiscordLinked(false); router.refresh() }
                  else alert('Failed to unlink Discord.')
                } finally { setUnlinking(false) }
              }}
              disabled={unlinking}
              className="btn-ghost text-xs text-red-400/70 hover:text-red-400"
            >
              {unlinking ? 'Unlinking…' : 'Unlink Discord Server'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-text-muted flex-shrink-0" />
              <span className="text-text-muted">Not connected</span>
            </div>
            <div className="space-y-2 text-xs text-text-secondary">
              <p>1. Click &quot;Install Bot&quot; to add the bot to your Discord server.</p>
              <p>2. Run <code className="text-accent">/setup</code> in your Discord server to link it to this guild.</p>
              <p>3. Run <code className="text-accent">/setup member-role:@YourRole</code> to set the registration role.</p>
              <p>4. Optionally: <code className="text-accent">/setup alliance-role:@AllianceRole</code> for alliance members.</p>
            </div>
            {process.env.NEXT_PUBLIC_DISCORD_APPLICATION_ID && (
              <a
                href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_APPLICATION_ID}&scope=bot+applications.commands&permissions=8`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm inline-block"
              >
                Install Bot
              </a>
            )}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="card p-5 border-red-900/40">
        <h2 className="font-display font-600 text-red-400 mb-1">Danger Zone</h2>
        <p className="text-text-secondary text-sm mb-4">
          Permanently delete this guild. All events, signups, roles, and templates will be deleted. This cannot be undone.
        </p>

        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">
            Delete Guild
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Type <span className="font-mono font-700 text-text-primary">{guild.name}</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder={guild.name}
              className="input w-full"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (deleteInput !== guild.name) return
                  setDeleting(true)
                  try {
                    const res = await fetch(`/api/guilds/${guild.slug}`, { method: 'DELETE' })
                    if (res.ok) router.push('/')
                    else {
                      const d = await res.json()
                      alert(d.error ?? 'Delete failed')
                    }
                  } finally { setDeleting(false) }
                }}
                disabled={deleteInput !== guild.name || deleting}
                className="btn-danger text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
              <button onClick={() => { setShowDelete(false); setDeleteInput('') }} className="btn-ghost text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
