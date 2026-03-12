'use client'

import { useState } from 'react'

interface Props {
  guildSlug: string
  debtCount: number
}

export function NotifyDebtButton({ guildSlug, debtCount }: Props) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ notified: number; failed: number } | null>(null)

  async function handleNotify() {
    setSending(true)
    setResult(null)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/siphoned-energy/notify`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      }
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <h3 className="font-display font-600 text-text-primary text-sm mb-1">Discord Debt Notifications</h3>
          <p className="text-xs text-text-muted">
            Send a Discord DM to all players who currently owe siphoned energy.
            {debtCount > 0 ? (
              <> <span className="text-teal-400 font-mono">{debtCount}</span> player{debtCount !== 1 ? 's' : ''} in debt.</>
            ) : (
              <> No players currently in debt.</>
            )}
          </p>
        </div>

        <button
          onClick={handleNotify}
          disabled={sending || debtCount === 0}
          className="btn-secondary text-xs px-4 py-2 flex items-center gap-2 border-teal-500/20 text-teal-400 hover:bg-teal-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          {sending ? 'Sending…' : 'Notify All In Debt'}
        </button>
      </div>

      {result && (
        <div className="mt-3 text-xs bg-teal-400/10 border border-teal-400/20 rounded-lg px-3 py-2">
          <span className="text-teal-400 font-medium">
            {result.notified} notification{result.notified !== 1 ? 's' : ''} sent
          </span>
          {result.failed > 0 && (
            <span className="text-text-muted"> · {result.failed} failed (DMs disabled or no Discord linked)</span>
          )}
        </div>
      )}
    </div>
  )
}
