'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function UnlockEventButton({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleUnlock() {
    if (!confirm('Unlock signups? Players will be able to sign up and modify their signups again.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/unlock`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Failed to unlock signups')
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
    <button onClick={handleUnlock} disabled={loading} className="btn-ghost text-xs">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
      {loading ? 'Unlocking…' : 'Unlock Signups'}
    </button>
  )
}
