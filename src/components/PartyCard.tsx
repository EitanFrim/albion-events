import { AnimatedListItem } from '@/components/motion/AnimatedList'
import { RoleNoteButton } from '@/components/RoleNoteButton'

interface AssignmentUser {
  id: string
  discordName: string
  inGameName: string | null
}

interface Assignment {
  id: string
  userId: string
  user: AssignmentUser
}

interface RoleSlot {
  id: string
  roleName: string
  capacity: number
  notes?: string | null
  assignments: Assignment[]
}

interface Party {
  id: string
  name: string
  roleSlots: RoleSlot[]
}

interface PartyCardProps {
  party: Party
  currentUserId: string | null
  withdrawnUserIds: Set<string>
  roleColorMap: Record<string, string>
}

const FALLBACK_COLOR = '#6b7280'

export function PartyCard({ party, currentUserId, withdrawnUserIds, roleColorMap }: PartyCardProps) {
  const cap = party.roleSlots.reduce((a, s) => a + s.capacity, 0)
  const fill = party.roleSlots.reduce((a, s) => a + s.assignments.length, 0)

  function getRoleColor(roleName: string): string {
    return roleColorMap[roleName.toLowerCase()] ?? FALLBACK_COLOR
  }

  return (
    <AnimatedListItem className="flex-shrink-0 w-52 rounded-xl border border-border bg-bg-surface">
      <div className="px-3 py-2.5 border-b border-border-subtle flex items-center justify-between rounded-t-xl bg-bg-elevated">
        <span className="font-display font-600 text-text-primary text-xs tracking-wide truncate">{party.name}</span>
        <span className="text-xs font-mono text-text-muted ml-2 flex-shrink-0">{fill}/{cap}</span>
      </div>
      <div className="p-2 space-y-0.5">
        {party.roleSlots.map((slot, slotIndex) => {
          const color = getRoleColor(slot.roleName)
          const indent = (slotIndex % 8) * 3
          const isFilled = slot.assignments.length >= slot.capacity
          return (
            <div key={slot.id} style={{ marginLeft: `${indent}px` }}>
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                style={{ backgroundColor: color + '18', borderLeft: `2px solid ${color}` }}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isFilled ? 'opacity-60' : ''}`} style={{ backgroundColor: color }} />
                <span className={`font-mono font-semibold truncate ${isFilled ? 'opacity-60' : ''}`} style={{ color }}>{slot.roleName}</span>
                <span className={`font-mono text-text-muted ml-auto flex-shrink-0 text-xs ${isFilled ? 'opacity-60' : ''}`}>
                  {slot.assignments.length}/{slot.capacity}
                </span>
                {slot.notes && (
                  <RoleNoteButton rawNote={slot.notes} roleName={slot.roleName} color={color} />
                )}
              </div>
              {slot.assignments.map(a => {
                const hasWithdrawn = withdrawnUserIds.has(a.userId)
                const isMe = currentUserId !== null && a.userId === currentUserId
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-1.5 px-2 py-0.5 ml-3 rounded ${hasWithdrawn ? 'opacity-70' : ''} ${isMe && !hasWithdrawn ? 'bg-accent/10 ring-1 ring-accent/30 -mx-1 px-3' : ''}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasWithdrawn ? 'bg-amber-400' : isMe ? 'bg-accent animate-pulse-soft' : 'bg-emerald-400'}`} />
                    <span className={`text-xs truncate ${hasWithdrawn ? 'text-amber-300/80 line-through' : isMe ? 'text-accent font-semibold' : 'text-emerald-300/80'}`}>
                      {a.user.inGameName || a.user.discordName}
                    </span>
                    {isMe && !hasWithdrawn && <span className="text-[10px] text-accent/70 font-mono flex-shrink-0">you</span>}
                    {hasWithdrawn && <span className="text-xs text-amber-400/60 font-mono flex-shrink-0">withdrew</span>}
                  </div>
                )
              })}
              {Array.from({ length: slot.capacity - slot.assignments.length }).map((_, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-0.5 ml-3">
                  <span className="w-1.5 h-1.5 rounded-full border border-border-subtle flex-shrink-0" />
                  <span className="text-xs text-text-muted/40 italic">open</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </AnimatedListItem>
  )
}
