'use client'

import type { SlotNote } from '@/components/SlotNoteEditor'

export interface BuildSetupOption {
  id: string
  name: string
  data: SlotNote
}

interface Props {
  setups: BuildSetupOption[]
  onSelect: (data: SlotNote) => void
}

export function BuildSetupPicker({ setups, onSelect }: Props) {
  if (setups.length === 0) return null

  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs text-text-muted flex-shrink-0">Load preset:</span>
      <select
        defaultValue=""
        onChange={e => {
          const setup = setups.find(s => s.id === e.target.value)
          if (setup) onSelect(setup.data as SlotNote)
          e.target.value = ''
        }}
        className="input text-xs py-1 flex-1 max-w-xs"
      >
        <option value="" disabled>Select a build setup…</option>
        {setups.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  )
}
