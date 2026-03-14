'use client'

import { useState, useEffect } from 'react'
import { SignupForm } from './SignupForm'

interface RoleSlot { id: string; roleName: string; capacity: number }
interface Party { id: string; name: string; roleSlots: RoleSlot[] }

interface Props {
  eventId: string
  parties: Party[]
  existingSignup: { preferredRoles: string[]; note: string } | null
  isLocked: boolean
}

export function SignupModal({ eventId, parties, existingSignup, isLocked }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Only auto-open if: not already signed up, not locked, and not dismissed this session
    if (existingSignup || isLocked) return

    const key = `signup-modal-dismissed-${eventId}`
    if (sessionStorage.getItem(key)) return

    setOpen(true)
  }, [eventId, existingSignup, isLocked])

  function handleClose() {
    setOpen(false)
    sessionStorage.setItem(`signup-modal-dismissed-${eventId}`, '1')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-strong transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <SignupForm
          eventId={eventId}
          parties={parties}
          existingSignup={existingSignup}
          isLocked={isLocked}
          onSignupComplete={handleClose}
        />
      </div>
    </div>
  )
}
