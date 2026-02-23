'use client'

import { useState, useEffect, useCallback } from 'react'

type RegearStatusType = 'PENDING' | 'APPROVED' | 'REJECTED'

interface RegearItem {
  id: string
  status: RegearStatusType
  note: string | null
  silverAmount: number | null
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
  user: { id: string; discordName: string; inGameName: string | null; avatarUrl: string | null }
  reviewedBy: { id: string; discordName: string; inGameName: string | null } | null
}

interface Props {
  eventId: string
  guildSlug: string
}

export function RegearsManager({ eventId }: Props) {
  const [items, setItems] = useState<RegearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [screenshotData, setScreenshotData] = useState<Record<string, string>>({})
  const [screenshotLoading, setScreenshotLoading] = useState<string | null>(null)

  // Per-row review state
  const [reviewAction, setReviewAction] = useState<Record<string, 'APPROVE' | 'REJECT' | null>>({})
  const [silverInput, setSilverInput] = useState<Record<string, string>>({})
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [reviewLoading, setReviewLoading] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<Record<string, string>>({})

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/regears`)
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function loadScreenshot(regearId: string) {
    if (screenshotData[regearId]) return
    setScreenshotLoading(regearId)
    try {
      const res = await fetch(`/api/events/${eventId}/regears/${regearId}`)
      if (!res.ok) return
      const data = await res.json()
      setScreenshotData(prev => ({ ...prev, [regearId]: data.screenshotData }))
    } finally {
      setScreenshotLoading(null)
    }
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      loadScreenshot(id)
    }
  }

  async function submitReview(regearId: string) {
    const action = reviewAction[regearId]
    if (!action) return
    setReviewLoading(regearId)
    setReviewError(prev => ({ ...prev, [regearId]: '' }))

    try {
      let body: Record<string, unknown>
      if (action === 'APPROVE') {
        const amount = parseInt(silverInput[regearId] ?? '', 10)
        if (!amount || amount <= 0) {
          setReviewError(prev => ({ ...prev, [regearId]: 'Enter a valid silver amount' }))
          return
        }
        body = { action: 'APPROVE', silverAmount: amount }
      } else {
        const noteText = (rejectNote[regearId] ?? '').trim()
        if (!noteText) {
          setReviewError(prev => ({ ...prev, [regearId]: 'Rejection reason is required' }))
          return
        }
        body = { action: 'REJECT', reviewNote: noteText }
      }

      const res = await fetch(`/api/events/${eventId}/regears/${regearId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setReviewError(prev => ({ ...prev, [regearId]: data.error ?? 'Review failed' }))
        return
      }

      // Refresh the list
      await fetchItems()
      setReviewAction(prev => ({ ...prev, [regearId]: null }))
      setExpandedId(null)
    } finally {
      setReviewLoading(null)
    }
  }

  const pending = items.filter(i => i.status === 'PENDING')
  const reviewed = items.filter(i => i.status !== 'PENDING')

  if (loading) {
    return <div className="card p-8 text-center text-text-muted text-sm">Loading regear requests\u2026</div>
  }

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-text-muted text-sm">No regear requests for this event.</p>
      </div>
    )
  }

  function renderItem(item: RegearItem) {
    const isExpanded = expandedId === item.id
    const playerName = item.user.inGameName || item.user.discordName
    const action = reviewAction[item.id]

    return (
      <div
        key={item.id}
        className={`card overflow-hidden ${
          item.status === 'PENDING' ? 'border-amber-900/30' :
          item.status === 'APPROVED' ? 'border-emerald-900/30' : 'border-red-900/30'
        }`}
      >
        {/* Row header */}
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-elevated/30 transition-colors"
          onClick={() => toggleExpand(item.id)}
        >
          {/* Avatar */}
          {item.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.user.avatarUrl} alt="" className="w-7 h-7 rounded-full flex-shrink-0 border border-border" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
              <span className="text-text-muted text-xs font-mono">{item.user.discordName[0]?.toUpperCase()}</span>
            </div>
          )}

          {/* Name + note */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-text-primary">{playerName}</span>
            {item.note && <span className="text-xs text-text-muted ml-2 truncate hidden sm:inline">{item.note}</span>}
          </div>

          {/* Status badge */}
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
            item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
            item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {item.status === 'PENDING' ? 'Pending' :
             item.status === 'APPROVED' ? `+${item.silverAmount?.toLocaleString()}` : 'Rejected'}
          </span>

          {/* Date */}
          <span className="text-xs text-text-muted font-mono hidden sm:block">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>

          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-text-muted transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Expanded section */}
        {isExpanded && (
          <div className="border-t border-border-subtle px-4 py-4 space-y-4 bg-bg-elevated/20">
            {/* Screenshot */}
            <div>
              <p className="text-xs text-text-muted font-mono uppercase tracking-widest mb-2">Screenshot</p>
              {screenshotLoading === item.id ? (
                <div className="h-32 flex items-center justify-center text-text-muted text-sm">Loading\u2026</div>
              ) : screenshotData[item.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={screenshotData[item.id]}
                  alt="Regear screenshot"
                  className="rounded-lg max-h-80 object-contain border border-border cursor-zoom-in"
                  onClick={() => window.open(screenshotData[item.id], '_blank')}
                />
              ) : (
                <div className="h-16 flex items-center justify-center text-text-muted text-sm italic">Failed to load screenshot</div>
              )}
            </div>

            {/* Player note */}
            {item.note && (
              <div>
                <p className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1">Player Note</p>
                <p className="text-sm text-text-secondary">{item.note}</p>
              </div>
            )}

            {/* Already reviewed result */}
            {item.status === 'APPROVED' && (
              <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/40 px-3 py-2">
                <p className="text-xs text-emerald-400 font-mono">
                  Approved by {item.reviewedBy?.inGameName || item.reviewedBy?.discordName} &mdash; +{item.silverAmount?.toLocaleString()} silver
                </p>
              </div>
            )}
            {item.status === 'REJECTED' && (
              <div className="rounded-lg bg-red-950/30 border border-red-900/40 px-3 py-2">
                <p className="text-xs text-red-400 font-mono">Rejected: {item.reviewNote}</p>
                {item.reviewedBy && (
                  <p className="text-xs text-red-400/60 font-mono mt-0.5">
                    by {item.reviewedBy.inGameName || item.reviewedBy.discordName}
                  </p>
                )}
              </div>
            )}

            {/* Review controls (only for PENDING) */}
            {item.status === 'PENDING' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setReviewAction(prev => ({ ...prev, [item.id]: 'APPROVE' })) }}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      action === 'APPROVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-bg-elevated text-text-muted border border-border hover:text-emerald-400'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setReviewAction(prev => ({ ...prev, [item.id]: 'REJECT' })) }}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      action === 'REJECT'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-bg-elevated text-text-muted border border-border hover:text-red-400'
                    }`}
                  >
                    Reject
                  </button>
                </div>

                {action === 'APPROVE' && (
                  <div>
                    <label className="label">Silver Amount</label>
                    <input
                      type="number"
                      min="1"
                      value={silverInput[item.id] ?? ''}
                      onChange={e => setSilverInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      placeholder="e.g. 250000"
                      className="input text-sm"
                      autoFocus
                    />
                  </div>
                )}

                {action === 'REJECT' && (
                  <div>
                    <label className="label">Reason</label>
                    <input
                      type="text"
                      value={rejectNote[item.id] ?? ''}
                      onChange={e => setRejectNote(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      placeholder="e.g. Not a qualifying death"
                      className="input text-sm"
                      maxLength={500}
                      autoFocus
                    />
                  </div>
                )}

                {reviewError[item.id] && <p className="text-red-400 text-xs">{reviewError[item.id]}</p>}

                {action && (
                  <button
                    onClick={(e) => { e.stopPropagation(); submitReview(item.id) }}
                    disabled={reviewLoading === item.id}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      action === 'APPROVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    }`}
                  >
                    {reviewLoading === item.id ? '\u2026' : action === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <section>
          <h2 className="font-display font-600 text-text-primary text-sm mb-3 flex items-center gap-2">
            Pending
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{pending.length}</span>
          </h2>
          <div className="space-y-2">{pending.map(renderItem)}</div>
        </section>
      )}

      {reviewed.length > 0 && (
        <section>
          <h2 className="font-display font-600 text-text-secondary text-sm mb-3">Reviewed</h2>
          <div className="space-y-2">{reviewed.map(renderItem)}</div>
        </section>
      )}
    </div>
  )
}
