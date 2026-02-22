'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CreateGuildForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function previewSlug(n: string) {
    return n.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 48)
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Guild name is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create guild'); return }
      router.push(`/g/${data.slug}`)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const slug = previewSlug(name)

  return (
    <div className="card p-6 space-y-5">
      <div>
        <label className="label">Guild Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Crimson Brotherhood"
          className="input w-full"
          maxLength={64}
          autoFocus
        />
        {name.trim() && (
          <p className="text-xs text-text-muted mt-1 font-mono">
            URL: /g/<span className="text-text-secondary">{slug}</span>
          </p>
        )}
      </div>

      <div>
        <label className="label">Description <span className="text-text-muted">(optional)</span></label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What kind of content does your guild run?"
          className="input w-full resize-none"
          rows={3}
          maxLength={280}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button onClick={() => router.back()} className="btn-ghost flex-1 justify-center">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading || !name.trim()} className="btn-primary flex-1 justify-center">
          {loading ? 'Creating…' : 'Create Guild'}
        </button>
      </div>

      <p className="text-xs text-text-muted text-center">
        An invite code will be generated automatically. Share it to invite members.
      </p>
    </div>
  )
}
