'use client'

import { formatSilver, rawNumber, NOTE_FIELDS, type SlotNote } from '@/lib/slot-note'

// Re-export types and utilities from shared lib (usable in both server and client components)
export { parseSlotNote, serializeSlotNote, hasNote, formatSilver, rawNumber, NOTE_FIELDS } from '@/lib/slot-note'
export type { SlotNote } from '@/lib/slot-note'

interface Props {
  note: SlotNote
  onChange: (note: SlotNote) => void
}

export function SlotNoteEditor({ note, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2">Build Setup <span className="normal-case tracking-normal">— all fields optional</span></p>
      <div className="grid grid-cols-2 gap-2">
        {NOTE_FIELDS.map(field => {
          const isGeneral = field.key === 'general'
          const isRegearValue = field.key === 'regearValue'
          return (
            <div key={field.key} className={isGeneral ? 'col-span-2' : ''}>
              <label className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                <span>{field.icon}</span>
                <span>{field.label}</span>
              </label>
              {isGeneral ? (
                <textarea
                  value={note.general ?? ''}
                  onChange={e => onChange({ ...note, general: e.target.value })}
                  placeholder={field.placeholder}
                  rows={2}
                  className="input w-full text-xs resize-none"
                />
              ) : isRegearValue ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatSilver(note.regearValue)}
                  onChange={e => onChange({ ...note, regearValue: rawNumber(e.target.value) })}
                  placeholder={field.placeholder}
                  className="input w-full text-xs py-1.5"
                />
              ) : (
                <input
                  type="text"
                  value={note[field.key] ?? ''}
                  onChange={e => onChange({ ...note, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="input w-full text-xs py-1.5"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
