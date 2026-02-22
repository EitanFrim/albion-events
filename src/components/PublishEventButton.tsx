'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  eventId: string
  currentStatus: string
}

export function PublishEventButton({ eventId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const isDraft = currentStatus === 'DRAFT'
  // Only show for DRAFT (publish) — once published other controls take over
  if (!isDraft) return null

  async function handlePublish() {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      })
      if (!res.ok) throw new Error('Failed to publish')
      router.refresh()
    } catch (e) {
      alert('Failed to publish event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="btn-primary text-xs flex items-center gap-1.5"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {loading ? 'Publishing…' : 'Publish'}
    </button>
  )
}
