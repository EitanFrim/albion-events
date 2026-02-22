'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props { eventId: string; eventTitle: string; guildSlug?: string }

export function DeleteEventButton({ eventId, eventTitle, guildSlug }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${eventTitle}"?\n\nThis will permanently remove all signups and assignments.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Failed to delete')
        return
      }
      router.push(guildSlug ? `/g/${guildSlug}` : '/')
      router.refresh()
    } catch { alert('Network error — please try again') }
    finally { setLoading(false) }
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn-danger text-xs">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}
