'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

interface GuildMember {
  id: string
  role: string
  status: string
  balance: number
  user: {
    id: string
    discordName: string
    inGameName: string | null
    avatarUrl: string | null
  }
}

interface SplitPlayer {
  membershipId: string
  displayName: string
  avatarUrl: string | null
  cut: number
}

interface SplitResult {
  membershipId: string
  displayName: string
  amount: number
  newBalance: number
}

interface Props {
  guildSlug: string
}

// Format a number string with commas: "1234567" → "1,234,567"
function formatWithCommas(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return parseInt(num, 10).toLocaleString()
}

// Parse a formatted string back to raw digits: "1,234,567" → "1234567"
function parseFormatted(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

export function LootSplitForm({ guildSlug }: Props) {
  // Form inputs (stored as raw digit strings)
  const [contentName, setContentName] = useState('')
  const [soldAmount, setSoldAmount] = useState('')
  const [silverBags, setSilverBags] = useState('')
  const [repairCost, setRepairCost] = useState('')
  const [guildTaxPct, setGuildTaxPct] = useState('')

  // Player roster
  const [players, setPlayers] = useState<SplitPlayer[]>([])

  // Guild members
  const [allMembers, setAllMembers] = useState<GuildMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState<{ added: string[]; notFound: string[] } | null>(null)

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SplitResult[] | null>(null)

  // Fetch members on mount
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/members`)
      if (!res.ok) return
      const data: GuildMember[] = await res.json()
      setAllMembers(data.filter(m => m.status === 'ACTIVE'))
    } finally {
      setMembersLoading(false)
    }
  }, [guildSlug])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  // Live calculation
  const calculation = useMemo(() => {
    const sold = parseInt(soldAmount, 10) || 0
    const bags = parseInt(silverBags, 10) || 0
    const repair = parseInt(repairCost, 10) || 0
    const taxPct = Math.min(100, Math.max(0, parseFloat(guildTaxPct) || 0))

    const totalSold = sold + bags
    const net = totalSold - repair
    const taxAmount = Math.floor(net * taxPct / 100)
    const afterTax = net - taxAmount
    const totalShares = players.reduce((sum, p) => sum + p.cut, 0)

    const perPlayer = players.map(p => ({
      ...p,
      calculatedAmount: totalShares > 0 && afterTax > 0
        ? Math.floor((afterTax * p.cut) / totalShares)
        : 0,
    }))

    const totalDistributed = perPlayer.reduce((sum, p) => sum + p.calculatedAmount, 0)

    return { sold, bags, totalSold, repair, taxPct, taxAmount, net, afterTax, totalShares, perPlayer, totalDistributed }
  }, [soldAmount, silverBags, repairCost, guildTaxPct, players])

  // Available members (not yet added)
  const filteredAvailableMembers = useMemo(() => {
    const addedIds = new Set(players.map(p => p.membershipId))
    const q = memberSearch.toLowerCase()
    return allMembers.filter(m => {
      if (addedIds.has(m.id)) return false
      if (!q) return true
      return (
        m.user.discordName.toLowerCase().includes(q) ||
        (m.user.inGameName ?? '').toLowerCase().includes(q)
      )
    })
  }, [allMembers, players, memberSearch])

  function addPlayer(member: GuildMember) {
    if (players.some(p => p.membershipId === member.id)) return
    setPlayers(prev => [...prev, {
      membershipId: member.id,
      displayName: member.user.inGameName ?? member.user.discordName,
      avatarUrl: member.user.avatarUrl,
      cut: 100,
    }])
  }

  function bulkAddPlayers() {
    const lines = bulkText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0)

    if (lines.length === 0) return

    const addedIds = new Set(players.map(p => p.membershipId))
    const added: string[] = []
    const notFound: string[] = []
    const newPlayers: SplitPlayer[] = []

    for (const line of lines) {
      const q = line.toLowerCase()
      const member = allMembers.find(m => {
        if (addedIds.has(m.id)) return false
        return (
          (m.user.inGameName ?? '').toLowerCase() === q ||
          m.user.discordName.toLowerCase() === q
        )
      })
      if (member) {
        addedIds.add(member.id)
        newPlayers.push({
          membershipId: member.id,
          displayName: member.user.inGameName ?? member.user.discordName,
          avatarUrl: member.user.avatarUrl,
          cut: 100,
        })
        added.push(member.user.inGameName ?? member.user.discordName)
      } else {
        notFound.push(line)
      }
    }

    if (newPlayers.length > 0) {
      setPlayers(prev => [...prev, ...newPlayers])
    }
    setBulkResult({ added, notFound })
    setBulkText('')
  }

  function removePlayer(membershipId: string) {
    setPlayers(prev => prev.filter(p => p.membershipId !== membershipId))
  }

  function updateCut(membershipId: string, value: string) {
    const parsed = Math.min(100, Math.max(0, parseInt(value, 10) || 0))
    setPlayers(prev => prev.map(p =>
      p.membershipId === membershipId ? { ...p, cut: parsed } : p
    ))
  }

  async function handleSubmit() {
    setError(null)

    if (!contentName.trim()) { setError('Content name is required'); return }
    if (calculation.afterTax <= 0) { setError('After-tax amount must be positive'); return }
    if (players.length === 0) { setError('Add at least one player'); return }
    if (calculation.totalShares === 0) { setError('At least one player must have a cut > 0%'); return }

    const payload = {
      contentName: contentName.trim(),
      soldAmount: calculation.totalSold,
      repairCost: calculation.repair,
      guildTax: calculation.taxAmount,
      players: calculation.perPlayer
        .filter(p => p.calculatedAmount > 0)
        .map(p => ({
          membershipId: p.membershipId,
          amount: p.calculatedAmount,
        })),
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/loot-split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to distribute loot split')
        return
      }
      const data = await res.json()
      setResults(data.results)
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setContentName('')
    setSoldAmount('')
    setSilverBags('')
    setRepairCost('')
    setGuildTaxPct('')
    setPlayers([])
    setResults(null)
    setError(null)
  }

  // Formatted number input handler
  function handleFormattedInput(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = parseFormatted(e.target.value)
      setter(raw)
    }
  }

  // Success state
  if (results) {
    const totalDisbursed = results.reduce((sum, r) => sum + r.amount, 0)
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-700 text-text-primary text-lg">Split Complete</h2>
              <p className="text-text-secondary text-sm mt-0.5">
                {contentName} &mdash; {totalDisbursed.toLocaleString()} silver distributed to {results.length} player{results.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {results.map(r => (
              <div key={r.membershipId} className="flex items-center justify-between px-4 py-2.5 bg-bg-elevated rounded-lg border border-border-subtle">
                <span className="text-sm text-text-primary">{r.displayName}</span>
                <div className="text-right">
                  <span className="font-mono text-sm text-emerald-400">+{r.amount.toLocaleString()}</span>
                  <span className="text-xs text-text-muted ml-2 font-mono">bal: {r.newBalance.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleReset} className="btn-primary">New Split</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Content Details */}
      <div className="card p-5 space-y-4">
        <h2 className="font-display font-600 text-text-primary text-sm">Content Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Content Name</label>
            <input
              type="text"
              value={contentName}
              onChange={e => setContentName(e.target.value)}
              placeholder="e.g. ZvZ Loot Run"
              className="input text-sm"
              maxLength={200}
            />
          </div>
          <div>
            <label className="label">Sold Amount</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatWithCommas(soldAmount)}
              onChange={handleFormattedInput(setSoldAmount)}
              placeholder="0"
              className="input text-sm"
            />
          </div>
          <div>
            <label className="label">Silver Bags</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatWithCommas(silverBags)}
              onChange={handleFormattedInput(setSilverBags)}
              placeholder="0"
              className="input text-sm"
            />
          </div>
          <div>
            <label className="label">Repair Cost</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatWithCommas(repairCost)}
              onChange={handleFormattedInput(setRepairCost)}
              placeholder="0"
              className="input text-sm"
            />
          </div>
          <div>
            <label className="label">Guild Tax (%)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={guildTaxPct}
                onChange={e => setGuildTaxPct(e.target.value)}
                placeholder="0"
                className="input text-sm pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Summary */}
      <div className="card px-5 py-3 flex flex-wrap gap-x-6 gap-y-2 items-center text-sm">
        <div>
          <span className="text-text-muted">Total Sold: </span>
          <span className="font-mono font-medium text-text-primary">{calculation.totalSold.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-text-muted">Net: </span>
          <span className={`font-mono font-medium ${calculation.net < 0 ? 'text-red-400' : 'text-text-primary'}`}>
            {calculation.net.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-text-muted">Tax ({calculation.taxPct}%): </span>
          <span className="font-mono font-medium text-text-primary">{calculation.taxAmount.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-text-muted">After Tax: </span>
          <span className={`font-mono font-medium ${calculation.afterTax <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {calculation.afterTax.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-text-muted">Players: </span>
          <span className="font-mono font-medium text-text-primary">{players.length}</span>
        </div>
        {calculation.totalDistributed > 0 && (
          <div className="ml-auto">
            <span className="text-text-muted">Distributing: </span>
            <span className="font-mono font-medium text-emerald-400">{calculation.totalDistributed.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Players Section */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display font-600 text-text-primary text-sm">
            Players
            {players.length > 0 && (
              <span className="ml-2 text-xs font-mono text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full border border-border-subtle">
                {players.length}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowBulkAdd(!showBulkAdd); setShowAddPanel(false); setBulkResult(null) }}
              className="btn-secondary text-xs"
              disabled={membersLoading}
            >
              {membersLoading ? 'Loading\u2026' : showBulkAdd ? 'Close Bulk' : 'Bulk Add'}
            </button>
            <button
              onClick={() => { setShowAddPanel(!showAddPanel); setShowBulkAdd(false); setBulkResult(null) }}
              className="btn-secondary text-xs"
              disabled={membersLoading}
            >
              {membersLoading ? 'Loading\u2026' : showAddPanel ? 'Close' : 'Add Player'}
            </button>
          </div>
        </div>

        {/* Bulk add panel */}
        {showBulkAdd && (
          <div className="bg-bg-elevated rounded-lg border border-border p-3 space-y-3">
            <div>
              <label className="label">Paste player names (one per line)</label>
              <textarea
                value={bulkText}
                onChange={e => { setBulkText(e.target.value); setBulkResult(null) }}
                placeholder={'imana98\nzedfrim\nclazimi'}
                rows={6}
                className="input text-sm font-mono resize-y w-full"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">
                Matches by in-game name or Discord name
              </p>
              <button
                onClick={bulkAddPlayers}
                disabled={!bulkText.trim()}
                className="btn-primary text-xs"
              >
                Find &amp; Add
              </button>
            </div>
            {bulkResult && (
              <div className="space-y-2 text-sm">
                {bulkResult.added.length > 0 && (
                  <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/40 px-3 py-2">
                    <p className="text-emerald-400 text-xs font-medium mb-1">
                      Added {bulkResult.added.length} player{bulkResult.added.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-emerald-400/70 text-xs font-mono">{bulkResult.added.join(', ')}</p>
                  </div>
                )}
                {bulkResult.notFound.length > 0 && (
                  <div className="rounded-lg bg-amber-950/30 border border-amber-900/40 px-3 py-2">
                    <p className="text-amber-400 text-xs font-medium mb-1">
                      Not found ({bulkResult.notFound.length})
                    </p>
                    <p className="text-amber-400/70 text-xs font-mono">{bulkResult.notFound.join(', ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add player panel */}
        {showAddPanel && (
          <div className="bg-bg-elevated rounded-lg border border-border p-3 space-y-2">
            <input
              type="text"
              placeholder="Search members\u2026"
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              className="input text-sm"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredAvailableMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => { addPlayer(m); setMemberSearch('') }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-overlay transition-colors"
                >
                  {m.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.user.avatarUrl} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-bg-surface border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-text-muted text-xs font-mono">{m.user.discordName[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <span className="text-sm text-text-primary">
                    {m.user.inGameName ?? m.user.discordName}
                  </span>
                </button>
              ))}
              {filteredAvailableMembers.length === 0 && (
                <p className="text-xs text-text-muted px-3 py-2">
                  {players.length === allMembers.length ? 'All members added' : 'No matches'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Player rows */}
        {players.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle p-6 text-center">
            <p className="text-text-muted text-sm">No players added yet. Click &quot;Add Player&quot; to search and add guild members.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {calculation.perPlayer.map(p => (
              <div
                key={p.membershipId}
                className="flex items-center gap-3 px-4 py-3 bg-bg-elevated rounded-lg border border-border-subtle"
              >
                {/* Avatar */}
                {p.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatarUrl} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-bg-surface border border-border flex items-center justify-center flex-shrink-0">
                    <span className="text-text-muted text-xs font-mono">{p.displayName[0]?.toUpperCase()}</span>
                  </div>
                )}

                {/* Name */}
                <span className="text-sm text-text-primary flex-1 min-w-0 truncate">{p.displayName}</span>

                {/* Cut % */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={p.cut}
                    onChange={e => updateCut(p.membershipId, e.target.value)}
                    className="input w-16 text-center text-sm py-1"
                  />
                  <span className="text-xs text-text-muted">%</span>
                </div>

                {/* Calculated amount */}
                <div className="w-32 text-right flex-shrink-0">
                  <span className={`font-mono text-sm font-medium ${
                    p.calculatedAmount > 0 ? 'text-emerald-400' : 'text-text-muted'
                  }`}>
                    {p.calculatedAmount > 0
                      ? `+${p.calculatedAmount.toLocaleString()}`
                      : '\u2014'}
                  </span>
                  {p.calculatedAmount > 0 && (
                    <span className="text-xs text-text-muted ml-1">silver</span>
                  )}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removePlayer(p.membershipId)}
                  className="text-text-muted hover:text-red-400 transition-colors p-1 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-950/30 border border-red-900/40 px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={handleReset} className="btn-ghost text-sm">
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || players.length === 0 || calculation.afterTax <= 0}
          className="btn-primary text-sm"
        >
          {submitting ? 'Distributing\u2026' : `Add to Balance (${calculation.totalDistributed.toLocaleString()} silver)`}
        </button>
      </div>
    </div>
  )
}
