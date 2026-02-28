'use client'

import { useState, useEffect, useCallback } from 'react'

interface SaleUser {
  id: string
  discordName: string
  inGameName: string | null
  avatarUrl: string | null
}

interface Sale {
  id: string
  price: number
  durationHours: number
  repairCost: number
  silverBags: number
  description: string | null
  status: 'OPEN' | 'DRAWN' | 'CANCELLED'
  splitCompleted: boolean
  expiresAt: string
  winnerId: string | null
  drawnAt: string | null
  createdAt: string
  createdBy: SaleUser
  winner: SaleUser | null
  _count: { bids: number }
}

interface Participant {
  id: string
  userId: string
  createdAt: string
  user: SaleUser
}

interface SaleDetail extends Omit<Sale, '_count'> {
  bids: Array<{
    id: string
    userId: string
    createdAt: string
    user: SaleUser
  }>
  participants: Participant[]
  splitCompleted: boolean
  splitAt: string | null
}

interface Props {
  guildSlug: string
  initialSales: Sale[]
}

function formatSilver(amount: number): string {
  return amount.toLocaleString('en-US')
}

function formatWithCommas(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return parseInt(num, 10).toLocaleString()
}

function parseFormatted(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

function formatTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function StatusBadge({ status, splitCompleted }: { status: string; splitCompleted?: boolean }) {
  const isClosed = status === 'DRAWN' && splitCompleted
  const styles = {
    OPEN: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    DRAWN: isClosed
      ? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  const label = isClosed ? 'CLOSED' : status
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${styles[status as keyof typeof styles] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'}`}>
      {label}
    </span>
  )
}

function cardBorderClass(status: string, splitCompleted?: boolean): string {
  if (status === 'OPEN') return 'border-l-4 border-l-amber-500/60'
  if (status === 'DRAWN' && splitCompleted) return 'border-l-4 border-l-zinc-500/40'
  if (status === 'DRAWN') return 'border-l-4 border-l-emerald-500/60'
  if (status === 'CANCELLED') return 'border-l-4 border-l-red-500/40'
  return ''
}

function Avatar({ user, size = 24 }: { user: SaleUser; size?: number }) {
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt="" className="rounded-full" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full bg-surface-2 flex items-center justify-center text-text-muted text-xs" style={{ width: size, height: size }}>
      {(user.inGameName || user.discordName).charAt(0).toUpperCase()}
    </div>
  )
}

export function LootTabSalesManager({ guildSlug, initialSales }: Props) {
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [showForm, setShowForm] = useState(false)
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<SaleDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Create form state
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('24')
  const [description, setDescription] = useState('')
  const [repairCost, setRepairCost] = useState('')
  const [silverBags, setSilverBags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Drawing state
  const [drawingId, setDrawingId] = useState<string | null>(null)

  // Participant tagging state
  const [tagInput, setTagInput] = useState('')
  const [tagging, setTagging] = useState(false)
  const [tagResult, setTagResult] = useState<{ added: string[]; notFound: string[]; alreadyTagged: string[] } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Guide state
  const [showGuide, setShowGuide] = useState(false)

  // Live countdown
  const [, setTick] = useState(0)
  useEffect(() => {
    const hasOpen = sales.some(s => s.status === 'OPEN')
    if (!hasOpen) return
    const interval = setInterval(() => setTick(t => t + 1), 30000) // update every 30s
    return () => clearInterval(interval)
  }, [sales])

  const refreshSales = useCallback(async () => {
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/loot-tab-sales`)
      if (res.ok) {
        const data = await res.json()
        setSales(data)
      }
    } catch { /* ignore */ }
  }, [guildSlug])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const priceNum = parseInt(parseFormatted(price), 10)
    const durationNum = parseInt(duration, 10)
    const repairNum = parseInt(parseFormatted(repairCost) || '0', 10)
    const silverBagsNum = parseInt(parseFormatted(silverBags) || '0', 10)

    if (!priceNum || priceNum <= 0) {
      setError('Price must be a positive number')
      return
    }
    if (!durationNum || durationNum < 1 || durationNum > 168) {
      setError('Duration must be between 1 and 168 hours')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/loot-tab-sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: priceNum,
          durationHours: durationNum,
          description: description.trim() || undefined,
          repairCost: repairNum,
          silverBags: silverBagsNum,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create sale')
        return
      }

      setSuccess('Sale created successfully!')
      setPrice('')
      setDuration('24')
      setDescription('')
      setRepairCost('')
      setSilverBags('')
      setShowForm(false)
      await refreshSales()
    } catch {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDraw = async (saleId: string) => {
    if (!confirm('Are you sure you want to draw the winner now?')) return
    setDrawingId(saleId)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/loot-tab-sales/${saleId}/draw`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.status === 'drawn') {
        setSuccess(`Winner drawn: ${data.winner.inGameName || data.winner.discordName}!`)
      } else if (data.status === 'no_bids') {
        setSuccess('No signups — sold to guild.')
      } else if (data.error) {
        setError(data.error)
      }
      await refreshSales()
    } catch {
      setError('Failed to draw winner')
    } finally {
      setDrawingId(null)
    }
  }

  const toggleExpand = async (saleId: string) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null)
      setExpandedDetail(null)
      setTagResult(null)
      setTagInput('')
      return
    }
    setExpandedSaleId(saleId)
    setDetailLoading(true)
    setTagResult(null)
    setTagInput('')
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/loot-tab-sales/${saleId}`)
      if (res.ok) {
        setExpandedDetail(await res.json())
      }
    } catch { /* ignore */ }
    setDetailLoading(false)
  }

  const refreshDetail = async (saleId: string) => {
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/loot-tab-sales/${saleId}`)
      if (res.ok) {
        setExpandedDetail(await res.json())
      }
    } catch { /* ignore */ }
  }

  const handleTagPlayers = async (saleId: string) => {
    const names = tagInput
      .split(/[,\n]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0)

    if (names.length === 0) return

    setTagging(true)
    setTagResult(null)
    setError(null)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/loot-tab-sales/${saleId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: names }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to tag players')
        return
      }
      setTagResult({
        added: data.added.map((a: any) => a.displayName),
        notFound: data.notFound,
        alreadyTagged: data.alreadyTagged,
      })
      setTagInput('')
      await refreshDetail(saleId)
    } catch {
      setError('Network error tagging players')
    } finally {
      setTagging(false)
    }
  }

  const handleRemoveParticipant = async (saleId: string, participantId: string) => {
    setRemovingId(participantId)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/loot-tab-sales/${saleId}/participants/${participantId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to remove participant')
        return
      }
      await refreshDetail(saleId)
    } catch {
      setError('Network error removing participant')
    } finally {
      setRemovingId(null)
    }
  }

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (saleId: string, description: string | null) => {
    const name = description || 'this sale'
    if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis will permanently remove the sale, all signups, and tagged participants. The Discord message will also be deleted.\n\nThis action cannot be undone.`)) return

    setDeletingId(saleId)
    setError(null)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/loot-tab-sales/${saleId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to delete sale')
        return
      }
      if (expandedSaleId === saleId) {
        setExpandedSaleId(null)
        setExpandedDetail(null)
      }
      setSuccess('Sale deleted successfully.')
      await refreshSales()
    } catch {
      setError('Network error deleting sale')
    } finally {
      setDeletingId(null)
    }
  }

  const activeSales = sales.filter(s => s.status === 'OPEN' || (s.status === 'DRAWN' && !s.splitCompleted))
  const closedSales = sales.filter(s => s.status === 'CANCELLED' || (s.status === 'DRAWN' && s.splitCompleted))

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="card border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-300 hover:text-red-200">dismiss</button>
        </div>
      )}
      {success && (
        <div className="card border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-400 text-sm">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-2 text-emerald-300 hover:text-emerald-200">dismiss</button>
        </div>
      )}

      {/* Create Sale */}
      <div className="card">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="font-display font-600 text-text-primary">New Loot Tab Sale</span>
          </div>
          <svg className={`w-4 h-4 text-text-muted transition-transform ${showForm ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showForm && (
          <form onSubmit={handleCreate} className="px-5 pb-5 space-y-4 border-t border-border-subtle pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Price (silver) *</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. 1,500,000"
                  value={price ? formatWithCommas(price) : ''}
                  onChange={e => setPrice(parseFormatted(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="label">Duration (hours) *</label>
                <input
                  type="number"
                  className="input w-full"
                  placeholder="24"
                  min={1}
                  max={168}
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g. T8 Avalonian Loot Tab"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Repair Cost (silver) *</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. 500,000"
                  value={repairCost ? formatWithCommas(repairCost) : ''}
                  onChange={e => setRepairCost(parseFormatted(e.target.value))}
                />
                <p className="text-text-muted text-xs mt-1">Stored for reference only</p>
              </div>
              <div>
                <label className="label">Silver Bags *</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. 200,000"
                  value={silverBags ? formatWithCommas(silverBags) : ''}
                  onChange={e => setSilverBags(parseFormatted(e.target.value))}
                />
                <p className="text-text-muted text-xs mt-1">Stored for reference only</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Sale'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* How It Works Guide */}
      <div className="card">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between px-5 py-3 text-left"
        >
          <div className="flex items-center gap-2 text-sm text-accent">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
            <span className="font-600">How does loot tab sales work?</span>
          </div>
          <svg className={`w-4 h-4 text-text-muted transition-transform ${showGuide ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showGuide && (
          <div className="px-5 pb-5 border-t border-border-subtle pt-4 text-sm text-text-secondary space-y-3">
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-mono font-600">1</span>
              <div>
                <p className="text-text-primary font-600">Create a sale</p>
                <p>Use <code className="text-accent text-xs">/loot-tab-sale</code> in Discord or the form above. Set the price, duration, repair cost, and silver bags.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-mono font-600">2</span>
              <div>
                <p className="text-text-primary font-600">Members sign up</p>
                <p>Guild members click the Sign Up button on the Discord embed during the sale window.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-mono font-600">3</span>
              <div>
                <p className="text-text-primary font-600">Draw a winner</p>
                <p>Use <code className="text-accent text-xs">/loot-tab-draw</code> in Discord or click &quot;Draw Now&quot; here. A random winner is selected.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-mono font-600">4</span>
              <div>
                <p className="text-text-primary font-600">Tag participants</p>
                <p>Add the players who were in the content run. Use the tag input on a sale, or in Discord type <code className="text-accent text-xs">!tag Player1, Player2</code> (comma-separated) or <code className="text-accent text-xs">!tag</code> followed by one name per line.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-mono font-600">5</span>
              <div>
                <p className="text-text-primary font-600">Split the loot</p>
                <p>Click &quot;Open in Loot Split&quot; on a drawn sale. This takes you to the Loot Split page with all the data pre-filled. Review the amounts, adjust if needed, then click &quot;Add to Balance&quot;. A Discord notification is sent with the full breakdown.</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border-subtle flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-500/60"></span>
                <span className="text-text-muted">Pending draw</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-500/60"></span>
                <span className="text-text-muted">Drawn (awaiting split)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-zinc-500/40"></span>
                <span className="text-text-muted">Closed (split done)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Sales */}
      {activeSales.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-700 text-text-primary mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-mono">
              {activeSales.length}
            </span>
            Active Sales
          </h2>
          <div className="space-y-3">
            {activeSales.map(sale => (
              <div key={sale.id} className={`card ${cardBorderClass(sale.status)}`}>
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-surface-2/50 transition-colors"
                  onClick={() => toggleExpand(sale.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-600 text-text-primary truncate">
                          {sale.description || 'Loot Tab Sale'}
                        </span>
                        <StatusBadge status={sale.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="font-mono">{formatSilver(sale.price)} silver</span>
                        <span>{sale._count.bids} signup{sale._count.bids !== 1 ? 's' : ''}</span>
                        <span className="text-amber-400">{formatTimeRemaining(sale.expiresAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      className="btn-primary text-sm px-3 py-1.5"
                      disabled={drawingId === sale.id}
                      onClick={(e) => { e.stopPropagation(); handleDraw(sale.id) }}
                    >
                      {drawingId === sale.id ? 'Drawing...' : 'Draw Now'}
                    </button>
                    <svg className={`w-4 h-4 text-text-muted transition-transform ${expandedSaleId === sale.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedSaleId === sale.id && (
                  <div className="px-5 pb-4 border-t border-border-subtle pt-3">
                    {detailLoading ? (
                      <p className="text-text-muted text-sm">Loading signups...</p>
                    ) : expandedDetail ? (
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                          <div>
                            <span className="text-text-muted">Created by</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Avatar user={sale.createdBy} size={18} />
                              <span className="text-text-primary">{sale.createdBy.inGameName || sale.createdBy.discordName}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-text-muted">Repair Cost</span>
                            <p className="text-text-primary font-mono">{formatSilver(sale.repairCost)}</p>
                          </div>
                          <div>
                            <span className="text-text-muted">Silver Bags</span>
                            <p className="text-text-primary font-mono">{formatSilver(sale.silverBags)}</p>
                          </div>
                          <div>
                            <span className="text-text-muted">Duration</span>
                            <p className="text-text-primary">{sale.durationHours}h</p>
                          </div>
                        </div>

                        <h3 className="text-sm font-600 text-text-secondary mb-2">
                          Signups ({expandedDetail.bids.length})
                        </h3>
                        {expandedDetail.bids.length === 0 ? (
                          <p className="text-text-muted text-sm">No signups yet.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {expandedDetail.bids.map(bid => (
                              <div key={bid.id} className="flex items-center gap-2 text-sm">
                                <Avatar user={bid.user} size={20} />
                                <span className="text-text-primary">{bid.user.inGameName || bid.user.discordName}</span>
                                <span className="text-text-muted text-xs">
                                  {new Date(bid.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tag participants — available on OPEN sales too */}
                        <div className="mt-6 pt-4 border-t border-border-subtle">
                          <h3 className="text-sm font-600 text-text-secondary mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-1.997M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                            </svg>
                            Tagged Players ({expandedDetail.participants.length})
                          </h3>

                          {/* Tag players input */}
                          <div className="mb-4">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                className="input flex-1"
                                placeholder="Enter player names separated by commas (e.g. Player1, Player2, Player3)"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleTagPlayers(sale.id)
                                  }
                                }}
                                disabled={tagging}
                              />
                              <button
                                className="btn-primary text-sm px-4"
                                onClick={() => handleTagPlayers(sale.id)}
                                disabled={tagging || !tagInput.trim()}
                              >
                                {tagging ? 'Adding...' : 'Add Players'}
                              </button>
                            </div>
                            <p className="text-text-muted text-xs mt-1">
                              You can also tag via Discord: <code className="text-accent">!tag Player1, Player2</code> or <code className="text-accent">!tag</code> with one name per line
                            </p>

                            {/* Tag result feedback */}
                            {tagResult && (
                              <div className="mt-2 text-sm space-y-1">
                                {tagResult.added.length > 0 && (
                                  <p className="text-emerald-400">
                                    Added: {tagResult.added.join(', ')}
                                  </p>
                                )}
                                {tagResult.alreadyTagged.length > 0 && (
                                  <p className="text-amber-400">
                                    Already tagged: {tagResult.alreadyTagged.join(', ')}
                                  </p>
                                )}
                                {tagResult.notFound.length > 0 && (
                                  <p className="text-red-400">
                                    Not found: {tagResult.notFound.join(', ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Participants list */}
                          {expandedDetail.participants.length === 0 ? (
                            <p className="text-text-muted text-sm">No players tagged yet. You can tag players now and execute the split after the winner is drawn.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {expandedDetail.participants.map(p => (
                                <div key={p.id} className="flex items-center gap-2 text-sm group">
                                  <Avatar user={p.user} size={20} />
                                  <span className="text-text-primary">
                                    {p.user.inGameName || p.user.discordName}
                                  </span>
                                  <button
                                    className="text-red-400/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                    onClick={() => handleRemoveParticipant(sale.id, p.id)}
                                    disabled={removingId === p.id}
                                    title="Remove participant"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Delete sale */}
                        <div className="mt-6 pt-4 border-t border-border-subtle">
                          <button
                            className="text-sm text-red-400/70 hover:text-red-400 flex items-center gap-1.5 transition-colors"
                            onClick={() => handleDelete(sale.id, sale.description)}
                            disabled={deletingId === sale.id}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            {deletingId === sale.id ? 'Deleting...' : 'Delete Sale'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-text-muted text-sm">Failed to load details.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="font-display text-lg font-700 text-text-primary mb-3">History</h2>
        {closedSales.length === 0 ? (
          <div className="card px-5 py-8 text-center text-text-muted text-sm">
            No completed sales yet. Create a sale to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {closedSales.map(sale => (
              <div key={sale.id} className={`card ${cardBorderClass(sale.status, sale.splitCompleted)}`}>
                <div
                  className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-surface-2/50 transition-colors"
                  onClick={() => toggleExpand(sale.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-display font-600 text-text-primary truncate text-sm">
                          {sale.description || 'Loot Tab Sale'}
                        </span>
                        <StatusBadge status={sale.status} splitCompleted={sale.splitCompleted} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="font-mono">{formatSilver(sale.price)} silver</span>
                        <span>{sale._count.bids} signup{sale._count.bids !== 1 ? 's' : ''}</span>
                        {sale.winner && (
                          <span className="text-emerald-400 flex items-center gap-1">
                            Winner: <strong>{sale.winner.inGameName || sale.winner.discordName}</strong>
                          </span>
                        )}
                        <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${expandedSaleId === sale.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>

                {expandedSaleId === sale.id && (
                  <div className="px-5 pb-4 border-t border-border-subtle pt-3">
                    {detailLoading ? (
                      <p className="text-text-muted text-sm">Loading...</p>
                    ) : expandedDetail ? (
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                          <div>
                            <span className="text-text-muted">Created by</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Avatar user={expandedDetail.createdBy} size={18} />
                              <span className="text-text-primary">{expandedDetail.createdBy.inGameName || expandedDetail.createdBy.discordName}</span>
                            </div>
                          </div>
                          {expandedDetail.winner && (
                            <div>
                              <span className="text-text-muted">Winner</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Avatar user={expandedDetail.winner} size={18} />
                                <span className="text-emerald-400">{expandedDetail.winner.inGameName || expandedDetail.winner.discordName}</span>
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-text-muted">Repair Cost</span>
                            <p className="text-text-primary font-mono">{formatSilver(sale.repairCost)}</p>
                          </div>
                          <div>
                            <span className="text-text-muted">Silver Bags</span>
                            <p className="text-text-primary font-mono">{formatSilver(sale.silverBags)}</p>
                          </div>
                        </div>

                        {/* Signups */}
                        <h3 className="text-sm font-600 text-text-secondary mb-2">
                          All Signups ({expandedDetail.bids.length})
                        </h3>
                        {expandedDetail.bids.length === 0 ? (
                          <p className="text-text-muted text-sm">No signups.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {expandedDetail.bids.map(bid => {
                              const isWinner = expandedDetail.winner?.id === bid.user.id
                              return (
                                <div key={bid.id} className="flex items-center gap-2 text-sm">
                                  <Avatar user={bid.user} size={20} />
                                  <span className={isWinner ? 'text-emerald-400 font-600' : 'text-text-primary'}>
                                    {bid.user.inGameName || bid.user.discordName}
                                  </span>
                                  {isWinner && (
                                    <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                      WINNER
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Participants & Split section — only for DRAWN sales */}
                        {expandedDetail.status === 'DRAWN' && (
                          <div className="mt-6 pt-4 border-t border-border-subtle">
                            {/* Split completed badge */}
                            {expandedDetail.splitCompleted && (
                              <div className="mb-4 flex items-center gap-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                  Split Completed
                                </span>
                                {expandedDetail.splitAt && (
                                  <span className="text-text-muted text-xs">
                                    {new Date(expandedDetail.splitAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}

                            <h3 className="text-sm font-600 text-text-secondary mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-1.997M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                              </svg>
                              Tagged Players ({expandedDetail.participants.length})
                            </h3>

                            {/* Tag players input — only if not yet split */}
                            {!expandedDetail.splitCompleted && (
                              <div className="mb-4">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    className="input flex-1"
                                    placeholder="Enter player names separated by commas (e.g. Player1, Player2, Player3)"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleTagPlayers(sale.id)
                                      }
                                    }}
                                    disabled={tagging}
                                  />
                                  <button
                                    className="btn-primary text-sm px-4"
                                    onClick={() => handleTagPlayers(sale.id)}
                                    disabled={tagging || !tagInput.trim()}
                                  >
                                    {tagging ? 'Adding...' : 'Add Players'}
                                  </button>
                                </div>
                                <p className="text-text-muted text-xs mt-1">
                                  You can also tag via Discord: <code className="text-accent">!tag Player1, Player2</code> or <code className="text-accent">!tag</code> with one name per line
                                </p>

                                {/* Tag result feedback */}
                                {tagResult && (
                                  <div className="mt-2 text-sm space-y-1">
                                    {tagResult.added.length > 0 && (
                                      <p className="text-emerald-400">
                                        Added: {tagResult.added.join(', ')}
                                      </p>
                                    )}
                                    {tagResult.alreadyTagged.length > 0 && (
                                      <p className="text-amber-400">
                                        Already tagged: {tagResult.alreadyTagged.join(', ')}
                                      </p>
                                    )}
                                    {tagResult.notFound.length > 0 && (
                                      <p className="text-red-400">
                                        Not found: {tagResult.notFound.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Participants list */}
                            {expandedDetail.participants.length === 0 ? (
                              <p className="text-text-muted text-sm">No players tagged yet.</p>
                            ) : (
                              <div className="space-y-1.5 mb-4">
                                {expandedDetail.participants.map(p => (
                                  <div key={p.id} className="flex items-center gap-2 text-sm group">
                                    <Avatar user={p.user} size={20} />
                                    <span className="text-text-primary">
                                      {p.user.inGameName || p.user.discordName}
                                    </span>
                                    {!expandedDetail.splitCompleted && (
                                      <button
                                        className="text-red-400/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                        onClick={() => handleRemoveParticipant(sale.id, p.id)}
                                        disabled={removingId === p.id}
                                        title="Remove participant"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Open in Loot Split — only for DRAWN sales with participants, not yet split */}
                            {expandedDetail.participants.length > 0 && !expandedDetail.splitCompleted && (
                              <a
                                href={`/g/${guildSlug}/admin/loot-split?saleId=${sale.id}`}
                                className="btn-primary text-sm inline-flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                                Open in Loot Split
                              </a>
                            )}
                          </div>
                        )}

                        {/* Delete sale — not available for split-completed sales */}
                        {!expandedDetail?.splitCompleted && (
                          <div className="mt-6 pt-4 border-t border-border-subtle">
                            <button
                              className="text-sm text-red-400/70 hover:text-red-400 flex items-center gap-1.5 transition-colors"
                              onClick={() => handleDelete(sale.id, sale.description)}
                              disabled={deletingId === sale.id}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                              {deletingId === sale.id ? 'Deleting...' : 'Delete Sale'}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-text-muted text-sm">Failed to load details.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
