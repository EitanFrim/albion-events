'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type RegearStatusType = 'PENDING' | 'APPROVED' | 'REJECTED'

interface ExistingRegear {
  id: string
  status: RegearStatusType
  silverAmount: number | null
  reviewNote: string | null
}

interface Props {
  eventId: string
  existingRegear: ExistingRegear | null
}

export function RegearButton({ eventId, existingRegear }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // If player already has a request, show status card
  if (existingRegear) {
    if (existingRegear.status === 'PENDING') {
      return (
        <div className="card p-4 border-amber-900/50 bg-amber-950/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Regear Pending</span>
          </div>
          <p className="text-sm text-text-secondary">Your regear request is awaiting officer review.</p>
        </div>
      )
    }
    if (existingRegear.status === 'APPROVED') {
      return (
        <div className="card p-4 border-emerald-900/50 bg-emerald-950/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Regear Approved</span>
          </div>
          <p className="text-sm text-text-primary">
            <span className="font-semibold text-amber-400">{existingRegear.silverAmount?.toLocaleString()} silver</span>{' '}
            has been added to your balance.
          </p>
        </div>
      )
    }
    if (existingRegear.status === 'REJECTED') {
      return (
        <>
          <div className="card p-4 border-red-900/50 bg-red-950/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-mono text-red-400 uppercase tracking-wider">Regear Rejected</span>
            </div>
            <p className="text-sm text-text-secondary mb-3">{existingRegear.reviewNote}</p>
            <button
              onClick={() => setModalOpen(true)}
              className="btn-secondary text-xs w-full justify-center"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit &amp; Resubmit
            </button>
          </div>
          {renderModal()}
        </>
      )
    }
  }

  const isResubmit = existingRegear?.status === 'REJECTED'

  function renderModal() {
    if (!modalOpen) return null
    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => setModalOpen(false)}
      >
        <div className="card p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
          <div>
            <h3 className="font-display font-bold text-text-primary text-lg">
              {isResubmit ? 'Resubmit Regear' : 'Request Regear'}
            </h3>
            <p className="text-text-secondary text-sm mt-1">
              {isResubmit
                ? 'Upload a new screenshot and resubmit your request.'
                : 'Upload a screenshot showing your death or gear loss.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File upload */}
            <div>
              <label className="label">Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-text-secondary
                  file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                  file:text-xs file:font-medium file:bg-accent file:text-white
                  hover:file:brightness-110 cursor-pointer"
              />
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview" className="mt-2 rounded-lg max-h-48 object-contain border border-border" />
              )}
            </div>

            {/* Note */}
            <div>
              <label className="label">
                Note{' '}
                <span className="normal-case font-body tracking-normal text-text-muted">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Died to gank in HCE, T8 set"
                rows={2}
                maxLength={500}
                className="input resize-none text-xs"
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1 text-sm py-2">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="btn-primary flex-1 justify-center text-sm py-2"
              >
                {loading ? 'Submitting\u2026' : isResubmit ? 'Resubmit' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5 MB'); return }
    if (!f.type.startsWith('image/')) { setError('Must be an image file'); return }
    setFile(f)
    setError('')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(f))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please attach a screenshot'); return }
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('screenshot', file)
      fd.append('note', note)
      const res = await fetch(`/api/events/${eventId}/regears`, { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to submit')
        return
      }
      setModalOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="btn-secondary text-xs w-full justify-center"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Ask for Regear
      </button>

      {renderModal()}
    </>
  )
}
