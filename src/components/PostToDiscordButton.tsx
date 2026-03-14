'use client'

import { useState, useRef, useEffect } from 'react'

interface Channel {
  id: string
  name: string
}

interface Props {
  eventId: string
  guildSlug: string
}

export function PostToDiscordButton({ eventId, guildSlug }: Props) {
  const [open, setOpen] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setError('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleOpen() {
    if (open) { setOpen(false); return }
    setOpen(true)
    setError('')
    setSuccess('')

    if (channels.length > 0) return // already loaded

    setLoading(true)
    try {
      const res = await fetch(`/api/guilds/${guildSlug}/discord-channels`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to load channels')
      }
      const data: Channel[] = await res.json()
      setChannels(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePost(channelId: string) {
    setPosting(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/events/${eventId}/post-discord`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to post')
      }
      setSuccess('Posted!')
      setTimeout(() => { setOpen(false); setSuccess('') }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="btn-ghost text-xs"
        style={{ color: '#5865F2' }}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
        </svg>
        Post to Discord
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-bg-elevated border border-border rounded-xl shadow-card-hover overflow-hidden">
          <div className="px-3 py-2 border-b border-border-subtle">
            <p className="text-xs font-medium text-text-primary">Choose a channel</p>
          </div>

          {loading && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-text-muted">Loading channels...</p>
            </div>
          )}

          {error && (
            <div className="px-3 py-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="px-3 py-3 text-center">
              <p className="text-xs text-emerald-400 font-medium">{success}</p>
            </div>
          )}

          {!loading && !error && !success && channels.length > 0 && (
            <div className="max-h-56 overflow-y-auto py-1">
              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => handlePost(ch.id)}
                  disabled={posting}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-overlay transition-colors text-left disabled:opacity-40"
                >
                  <span className="text-text-muted text-xs">#</span>
                  <span className="text-sm text-text-primary truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && !error && channels.length === 0 && !success && (
            <div className="px-3 py-3">
              <p className="text-xs text-text-muted">No text channels found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
