'use client'

export interface SlotNote {
  weapon?: string
  offHand?: string
  head?: string
  chest?: string
  shoes?: string
  cape?: string
  foodPotion?: string
  mount?: string
  regearValue?: string
  general?: string
}

export const NOTE_FIELDS: { key: keyof SlotNote; label: string; icon: string; placeholder: string }[] = [
  { key: 'weapon',    label: 'Weapon',      icon: '⚔️',  placeholder: 'e.g. Great Frost Staff' },
  { key: 'offHand',  label: 'Off Hand',    icon: '🛡️',  placeholder: 'e.g. Mistcaller' },
  { key: 'head',     label: 'Head',        icon: '🪖',  placeholder: 'e.g. Scholar Cowl' },
  { key: 'chest',    label: 'Chest',       icon: '👕',  placeholder: 'e.g. Cleric Robe' },
  { key: 'shoes',    label: 'Shoes',       icon: '👟',  placeholder: 'e.g. Scholar Sandals' },
  { key: 'cape',     label: 'Cape',        icon: '🧣',  placeholder: 'e.g. Thetford Cape' },
  { key: 'foodPotion', label: 'Food / Potion', icon: '🍖', placeholder: 'e.g. Pork Omelette / Resistance Potion' },
  { key: 'mount',       label: 'Mount',        icon: '🐎',  placeholder: 'e.g. Swiftclaw' },
  { key: 'regearValue', label: 'Regear Value', icon: '💰', placeholder: 'e.g. 250,000' },
  { key: 'general',     label: 'General Note', icon: '📝', placeholder: 'Rotation tips, IP floor, any extra info…' },
]

/** Format a numeric string with commas (e.g. "1250000" → "1,250,000") */
export function formatSilver(value: string | number | null | undefined): string {
  if (value == null || value === '') return ''
  const num = typeof value === 'number' ? value : parseInt(String(value).replace(/[^0-9]/g, ''), 10)
  if (isNaN(num)) return ''
  return num.toLocaleString('en-US')
}

/** Strip non-digits from a string (e.g. "1,250,000" → "1250000") */
export function rawNumber(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

export function parseSlotNote(raw: string | null | undefined): SlotNote {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return { general: raw } }
}

export function serializeSlotNote(note: SlotNote): string | null {
  const clean = Object.fromEntries(Object.entries(note).filter(([, v]) => v && v.trim()))
  return Object.keys(clean).length > 0 ? JSON.stringify(clean) : null
}

export function hasNote(note: SlotNote | null | undefined): boolean {
  if (!note) return false
  return Object.values(note).some(v => v && v.trim())
}

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
