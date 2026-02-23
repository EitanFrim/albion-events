'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type RegearStatusType = 'PENDING' | 'APPROVED' | 'REJECTED'

interface ExistingRegear {
  id: string
  status: RegearStatusType
  silverAmount: number | null
  reviewNote: string | null
  reviewedBy: { discordName: string; inGameName: string | null } | null
}

interface AssignedRoleInfo {
  roleName: string
  notes: string | null
}

interface Props {
  eventId: string
  existingRegear: ExistingRegear | null
  assignedRole?: AssignedRoleInfo | null
}

export function RegearButton({ eventId, existingRegear, assignedRole }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [existingScreenshot, setExistingScreenshot] = useState<string | null>(null)
  const [loadingScreenshot, setLoadingScreenshot] = useState(false)

  const isResubmit = existingRegear?.status === 'REJECTED'
  const reviewerName = existingRegear?.reviewedBy?.inGameName || existingRegear?.reviewedBy?.discordName

  // Load existing screenshot when opening resubmit modal
  useEffect(() => {
    if (modalOpen && isResubmit && existingRegear && !existingScreenshot) {
      setLoadingScreenshot(true)
      fetch(`/api/events/${eventId}/regears/${existingRegear.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.screenshotData) setExistingScreenshot(data.screenshotData)
        })
        .finally(() => setLoadingScreenshot(false))
    }
  }, [modalOpen, isResubmit, existingRegear, existingScreenshot, eventId])

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
    // For new submissions, file is required. For resubmit, it's optional (keep existing).
    if (!file && !isResubmit) { setError('Please attach a screenshot'); return }
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      if (file) {
        fd.append('screenshot', file)
      }
      fd.append('note', note)
      if (isResubmit && !file) {
        fd.append('keepExisting', 'true')
      }
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

  function renderModal() {
    if (!modalOpen) return null
    const hasScreenshot = file || (isResubmit && existingScreenshot)
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
                ? 'Update your screenshot or note and resubmit.'
                : 'Upload a screenshot showing your death or gear loss.'}
            </p>
          </div>

          {/* Assigned role info */}
          {assignedRole && (
            <div className="rounded-lg bg-accent/5 border border-accent/15 px-3 py-2.5">
              <p className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1">Assigned Role</p>
              <p className="text-sm font-mono font-semibold text-accent">{assignedRole.roleName}</p>
              {assignedRole.notes && (
                <p className="text-xs text-text-secondary mt-1 italic">{assignedRole.notes}</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Screenshot section */}
            <div>
              <label className="label">Screenshot</label>

              {/* Show current preview (new file takes priority over existing) */}
              {previewUrl ? (
                <div className="mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="New screenshot" className="rounded-lg max-h-48 object-contain border border-border" />
                  <p className="text-xs text-emerald-400 mt-1">New screenshot selected</p>
                </div>
              ) : isResubmit && loadingScreenshot ? (
                <div className="mb-2 h-24 flex items-center justify-center text-text-muted text-sm border border-border-subtle rounded-lg">
                  Loading current screenshot{'\u2026'}
                </div>
              ) : isResubmit && existingScreenshot ? (
                <div className="mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={existingScreenshot} alt="Current screenshot" className="rounded-lg max-h-48 object-contain border border-border opacity-80" />
                  <p className="text-xs text-text-muted mt-1">Current screenshot (select a file below to replace)</p>
                </div>
              ) : null}

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-text-secondary
                  file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                  file:text-xs file:font-medium file:bg-accent file:text-white
                  hover:file:brightness-110 cursor-pointer"
              />
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
                disabled={loading || !hasScreenshot}
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

  // Status cards for existing requests
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
          {reviewerName && (
            <p className="text-xs text-text-muted mt-1">Approved by {reviewerName}</p>
          )}
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
            <p className="text-sm text-text-secondary">{existingRegear.reviewNote}</p>
            {reviewerName && (
              <p className="text-xs text-text-muted mt-1">Rejected by {reviewerName}</p>
            )}
            <button
              onClick={() => setModalOpen(true)}
              className="btn-secondary text-xs w-full justify-center mt-3"
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

  // No existing request — show submit button
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
