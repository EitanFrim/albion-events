'use client'

import { useState, useEffect, useCallback } from 'react'

interface Transaction {
  id: string
  amount: number
  balanceAfter: number
  reason: string | null
  createdAt: string
  performedBy: { id: string; discordName: string; inGameName: string | null }
}

interface Props {
  guildSlug: string
  currentBalance: number
}

export function MyBalanceLogs({ guildSlug, currentBalance }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')

  const fetchLogs = useCallback(async (cursor?: string) => {
    const isLoadMore = !!cursor
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const url = `/api/guilds/${guildSlug}/my-balance-logs?limit=50${cursor ? `&cursor=${cursor}` : ''}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()

      if (isLoadMore) {
        setTransactions(prev => [...prev, ...data.items])
      } else {
        setTransactions(data.items)
      }
      setNextCursor(data.nextCursor)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [guildSlug])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filtered = transactions.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.performedBy.discordName.toLowerCase().includes(q) ||
      (t.performedBy.inGameName ?? '').toLowerCase().includes(q) ||
      (t.reason ?? '').toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="card p-8 text-center text-text-muted text-sm">Loading transactions…</div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Balance summary */}
      <div className="card p-5 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://render.albiononline.com/v1/item/T8_SILVERBAG_NONTRADABLE" alt="Silver" className="w-10 h-10 flex-shrink-0" />
        <div>
          <p className="text-xs text-text-muted font-mono uppercase tracking-wider">Current Balance</p>
          <p className={`text-2xl font-mono font-bold ${currentBalance < 0 ? 'text-red-400' : 'text-amber-400'}`}>
            {currentBalance.toLocaleString()} <span className="text-sm font-normal text-text-muted">silver</span>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by reason or officer…"
          className="input text-sm py-1.5 flex-1"
        />
        <span className="text-xs text-text-muted font-mono">{filtered.length} entries</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-text-muted text-sm">
          {transactions.length === 0 ? 'No balance transactions yet.' : 'No matching transactions.'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(t => {
            const isDeposit = t.amount > 0
            const officerName = t.performedBy.inGameName || t.performedBy.discordName
            const date = new Date(t.createdAt)

            return (
              <div key={t.id} className="card px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* Amount indicator */}
                <div className={`w-20 text-right font-mono text-sm font-medium ${isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isDeposit ? '+' : ''}{t.amount.toLocaleString()}
                </div>

                {/* Balance after */}
                <span className="text-xs font-mono text-text-muted">
                  bal: <span className={t.balanceAfter < 0 ? 'text-red-400' : 'text-amber-400'}>{t.balanceAfter.toLocaleString()}</span>
                </span>

                {/* Reason */}
                <span className="text-xs text-text-secondary truncate flex-1 min-w-[100px]">
                  {t.reason || <span className="italic text-text-muted">no reason</span>}
                </span>

                {/* Officer */}
                <span className="text-xs text-text-muted">
                  by <span className="text-purple-400">{officerName}</span>
                </span>

                {/* Date */}
                <span className="text-xs text-text-muted font-mono">
                  {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Load more */}
      {nextCursor && (
        <div className="text-center pt-2">
          <button
            onClick={() => fetchLogs(nextCursor)}
            disabled={loadingMore}
            className="btn-ghost text-sm px-4 py-2 text-text-secondary hover:text-text-primary"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
