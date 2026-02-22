'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CompleteEventButton({ eventId, guildSlug }: { eventId: string; guildSlug?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleComplete() {
    if (!confirm('Mark this content as completed? It will move to Past Content.')) return
    setLoading(true)
    try {
      await fetch(`/api/events/${eventId}/complete`, { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleComplete} disabled={loading} className="btn-ghost text-xs">
      {loading ? 'Closing…' : '✓ Close Event'}
    </button>
  )
}
