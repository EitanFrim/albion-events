'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Transaction {
  id: string
  playerName: string
  amount: number
  energyAfter: number | null
  reason: string | null
  logDate: string
  performedBy: { id: string; discordName: string; inGameName: string | null }
}

interface Props {
  guildSlug: string
  currentEnergy: number
}

export function MySiphonedEnergyLogs({ guildSlug, currentEnergy }: Props) {
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
      const url = `/api/guilds/${guildSlug}/my-siphoned-energy-logs?limit=50${cursor ? `&cursor=${cursor}` : ''}`
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
    return <div className="card p-8 text-center text-text-muted text-sm">Loading transactions…</div>
  }

  return (
    <div className="space-y-4">
      {/* Energy summary */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-text-muted font-mono uppercase tracking-wider">Siphoned Energy</p>
          <p className={`text-2xl font-mono font-bold ${currentEnergy < 0 ? 'text-red-400' : 'text-teal-400'}`}>
            {currentEnergy.toLocaleString()} <span className="text-sm font-normal text-text-muted">energy</span>
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
          <Image src="/images/ui/empty-events.png" alt="" width={80} height={80} className="mx-auto mb-3 opacity-50" />
          {transactions.length === 0 ? 'No energy transactions yet.' : 'No matching transactions.'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(t => {
            const isDeposit = t.amount > 0
            const officerName = t.performedBy.inGameName || t.performedBy.discordName
            const date = new Date(t.logDate)

            return (
              <div key={t.id} className="card px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* Amount */}
                <div className={`w-16 text-right font-mono text-sm font-medium ${isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isDeposit ? '+' : ''}{t.amount.toLocaleString()}
                </div>

                {/* Energy after */}
                {t.energyAfter != null && (
                  <span className="text-xs font-mono text-text-muted">
                    bal: <span className="text-teal-400">{t.energyAfter.toLocaleString()}</span>
                  </span>
                )}

                {/* Reason */}
                <span className="text-xs text-text-secondary truncate flex-1 min-w-[100px]">
                  {t.reason || <span className="italic text-text-muted">—</span>}
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
