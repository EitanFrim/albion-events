'use client'

import { useState, useEffect, useRef } from 'react'

interface Transaction {
  id: string
  amount: number
  balanceAfter: number
  reason: string | null
  createdAt: string
}

interface Props {
  transactions: Transaction[]
  guildSlug: string
}

export function BalanceNotifications({ transactions, guildSlug }: Props) {
  const [visible, setVisible] = useState<Transaction[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const markedRef = useRef(false)
  const prevIdsRef = useRef('')

  // When new transactions arrive from server, show them
  useEffect(() => {
    const ids = transactions.map(t => t.id).join(',')
    if (ids && ids !== prevIdsRef.current) {
      prevIdsRef.current = ids
      setVisible(transactions)
      setDismissed(new Set())
    } else if (!ids) {
      setVisible([])
    }
  }, [transactions])

  // Mark as seen on mount (fire-and-forget), only once per batch
  useEffect(() => {
    if (transactions.length === 0 || markedRef.current) return
    markedRef.current = true

    fetch(`/api/guilds/${guildSlug}/balance-seen`, { method: 'POST' }).catch(() => {})
  }, [transactions, guildSlug])

  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id))
  }

  const dismissAll = () => {
    setDismissed(new Set(visible.map(t => t.id)))
  }

  const active = visible.filter(t => !dismissed.has(t.id))

  if (active.length === 0) return null

  return (
    <div className="fixed top-16 right-4 z-40 flex flex-col gap-2 max-w-sm w-full">
      {active.length > 1 && (
        <button
          onClick={dismissAll}
          className="self-end text-xs text-text-muted hover:text-text-secondary transition-colors px-2 py-1"
        >
          Dismiss all
        </button>
      )}

      {active.map(t => {
        const isPositive = t.amount > 0
        return (
          <div
            key={t.id}
            className="animate-slide-up bg-bg-elevated/95 backdrop-blur-md border border-border rounded-xl px-4 py-3 shadow-card-hover flex items-start gap-3"
          >
            {/* Coin icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-mono font-medium ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {isPositive ? '+' : ''}{t.amount.toLocaleString()} silver
              </span>
              {t.reason && (
                <p className="text-xs text-text-secondary mt-0.5 truncate">{t.reason}</p>
              )}
              <p className="text-xs text-text-muted mt-0.5 font-mono">
                Balance: {t.balanceAfter.toLocaleString()}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 text-text-muted hover:text-text-secondary transition-colors p-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
