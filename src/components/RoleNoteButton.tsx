'use client'

import { useState, useRef } from 'react'
import { type SlotNote, NOTE_FIELDS, parseSlotNote, hasNote, formatSilver } from '@/components/SlotNoteEditor'

interface Props {
  rawNote: string | null | undefined
  roleName: string
  color: string
}

export function RoleNoteButton({ rawNote, roleName, color }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const note: SlotNote = parseSlotNote(rawNote)

  if (!hasNote(note)) return null

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        title="View build note"
        className={`w-5 h-5 flex items-center justify-center rounded text-xs transition-all flex-shrink-0 ${
          open ? 'bg-accent/20 text-accent' : 'text-text-muted/60 hover:text-accent hover:bg-accent/10'
        }`}
      >
        📋
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-border bg-bg-elevated shadow-2xl overflow-hidden"
            style={{ borderTop: `3px solid ${color}` }}
          >
            <div className="px-3 py-2 flex items-center gap-2 border-b border-border-subtle">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs font-mono font-semibold flex-1" style={{ color }}>{roleName}</span>
              <span className="text-xs text-text-muted">Build Guide</span>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary ml-1 text-sm leading-none">×</button>
            </div>
            <div className="p-3 space-y-2">
              {NOTE_FIELDS.filter(f => note[f.key]?.trim()).map(field => {
                const displayValue = field.key === 'regearValue'
                  ? `${formatSilver(note.regearValue)} silver`
                  : note[field.key]
                return (
                  <div key={field.key} className={field.key === 'general' ? 'pt-1.5 mt-0.5 border-t border-border-subtle' : ''}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs w-5 flex-shrink-0 mt-0.5">{field.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-mono text-text-muted">{field.label}</span>
                        <p className={`text-xs whitespace-pre-wrap leading-relaxed mt-0.5 ${field.key === 'regearValue' ? 'text-amber-400 font-mono font-semibold' : 'text-text-primary'}`}>{displayValue}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
