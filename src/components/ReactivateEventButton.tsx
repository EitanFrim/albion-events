'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ReactivateEventButton({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleReactivate() {
    if (!confirm('Reactivate this event? It will reopen for signups.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/reactivate`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Failed to reactivate event')
        return
      }
      router.refresh()
    } catch {
      alert('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleReactivate} disabled={loading} className="btn-ghost text-xs">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {loading ? 'Reactivating…' : 'Reactivate'}
    </button>
  )
}
