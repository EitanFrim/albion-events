'use client'

interface Assignment {
  user: { id: string; discordName: string; inGameName: string | null }
}
interface RoleSlot {
  assignments: Assignment[]
}
interface Party {
  roleSlots: RoleSlot[]
}
interface Signup {
  user: { id: string; discordName: string; inGameName: string | null }
}

interface Props {
  eventTitle: string
  parties: Party[]
  signups: Signup[]
}

export function ExportPlayersButton({ eventTitle, parties, signups }: Props) {
  function handleExport() {
    const assignedUsers = new Map<string, string>()
    parties.forEach(p =>
      p.roleSlots.forEach(s =>
        s.assignments.forEach(a => {
          const name = a.user.inGameName || a.user.discordName
          assignedUsers.set(a.user.id, name)
        })
      )
    )

    const signedUpOnly = signups.filter(s => !assignedUsers.has(s.user.id))

    const lines: string[] = []

    if (assignedUsers.size > 0) {
      lines.push('=== ASSIGNED ===')
      assignedUsers.forEach(name => lines.push(name))
    }

    if (signedUpOnly.length > 0) {
      if (lines.length > 0) lines.push('')
      lines.push('=== SIGNED UP (not yet assigned) ===')
      signedUpOnly.forEach(s => lines.push(s.user.inGameName || s.user.discordName))
    }

    if (lines.length === 0) {
      lines.push('No players signed up yet.')
    }

    const content = lines.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    a.download = `players_${safeName}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleExport} className="btn-ghost text-xs flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export Players
    </button>
  )
}
