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
  expiresAt: string
  winnerId: string | null
  drawnAt: string | null
  createdAt: string
  createdBy: SaleUser
  winner: SaleUser | null
  _count: { bids: number }
}

interface SaleDetail extends Omit<Sale, '_count'> {
  bids: Array<{
    id: string
    userId: string
    createdAt: string
    user: SaleUser
  }>
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

function StatusBadge({ status }: { status: string }) {
  const styles = {
    OPEN: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    DRAWN: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${styles[status as keyof typeof styles] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'}`}>
      {status}
    </span>
  )
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
        setSuccess('No signups — sale has been cancelled.')
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
      return
    }
    setExpandedSaleId(saleId)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/loot-tab-sales/${saleId}`)
      if (res.ok) {
        setExpandedDetail(await res.json())
      }
    } catch { /* ignore */ }
    setDetailLoading(false)
  }

  const openSales = sales.filter(s => s.status === 'OPEN')
  const closedSales = sales.filter(s => s.status !== 'OPEN')

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

      {/* Active Sales */}
      {openSales.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-700 text-text-primary mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-mono">
              {openSales.length}
            </span>
            Active Sales
          </h2>
          <div className="space-y-3">
            {openSales.map(sale => (
              <div key={sale.id} className="card">
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
              <div key={sale.id} className="card">
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
                        <StatusBadge status={sale.status} />
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
