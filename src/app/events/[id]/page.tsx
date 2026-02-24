import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { format } from 'date-fns'
import Link from 'next/link'
import { SignupForm } from '@/components/SignupForm'
import { DeleteEventButton } from '@/components/DeleteEventButton'
import { CompleteEventButton } from '@/components/CompleteEventButton'
import { RoleNoteButton } from '@/components/RoleNoteButton'
import { PublishEventButton } from '@/components/PublishEventButton'
import { EventStatus } from '@prisma/client'

const statusConfig: Record<EventStatus, { label: string; cls: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'badge-gray',  dot: 'bg-text-muted' },
  PUBLISHED: { label: 'Open',      cls: 'badge-green', dot: 'bg-emerald-400 animate-pulse-soft' },
  LOCKED:    { label: 'Locked',    cls: 'badge-amber', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', cls: 'badge-gray',  dot: 'bg-text-muted' },
}

export const dynamic = 'force-dynamic'

export default async function EventPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user.role === 'ADMIN'

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { discordName: true, avatarUrl: true } },
      parties: {
        orderBy: { displayOrder: 'asc' },
        include: {
          roleSlots: {
            orderBy: { displayOrder: 'asc' },
            include: {
              assignments: {
                include: { user: { select: { id: true, discordName: true, inGameName: true } } },
              },
            },
          },
        },
      },
    },
  })

  if (!event) notFound()
  if (event.status === 'DRAFT' && !isAdmin) notFound()

  // Fetch guild roles with category for color lookup
  let roleColorMap: Record<string, string> = {}
  try {
    const guildRoles = await (prisma as any).guildRole2.findMany({ include: { category: true } })
    roleColorMap = Object.fromEntries(
      guildRoles.map((r: any) => [r.name.toLowerCase(), r.category?.color ?? '#6b7280'])
    )
  } catch {}

  // Fetch withdrawal status for all assigned users
  const allAssignedUserIds = event.parties.flatMap(p =>
    p.roleSlots.flatMap(s => s.assignments.map(a => a.userId))
  )
  const withdrawnUserIds = new Set(
    allAssignedUserIds.length > 0
      ? (await prisma.signup.findMany({
          where: { eventId: params.id, userId: { in: allAssignedUserIds }, status: 'WITHDRAWN' },
          select: { userId: true },
        })).map(s => s.userId)
      : []
  )

  // Fetch all signups for the public signup list
  const allSignups = await prisma.signup.findMany({
    where: { eventId: params.id, status: 'ACTIVE' },
    include: { user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  })

  let mySignup = null
  if (session?.user.id) {
    mySignup = await prisma.signup.findFirst({
      where: { eventId: params.id, userId: session.user.id, status: 'ACTIVE' },
      include: { assignment: { include: { roleSlot: true } } },
    })
  }

  const sc = statusConfig[event.status]
  const totalSlots = event.parties.reduce((a, p) => a + p.roleSlots.reduce((b, s) => b + s.capacity, 0), 0)
  const filledSlots = event.parties.reduce((a, p) => a + p.roleSlots.reduce((b, s) => b + s.assignments.length, 0), 0)

  function getRoleColor(roleName: string) {
    return roleColorMap[roleName.toLowerCase()] ?? '#6b7280'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">

      {/* Back + admin tools */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Link href="/" className="btn-ghost text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Events
        </Link>
        {isAdmin && (
          <>
            <Link href={`/admin/events/${params.id}/edit`} className="btn-ghost text-xs">Edit</Link>
            <Link href={`/admin/events/${params.id}/assign`} className="btn-secondary text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Assign Players
            </Link>
            <PublishEventButton eventId={params.id} currentStatus={event.status} />
            {event.status !== 'COMPLETED' && (
              <CompleteEventButton eventId={params.id} />
            )}
            <DeleteEventButton eventId={params.id} eventTitle={event.title} />
          </>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={`badge ${sc.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
          <span className="text-xs text-text-muted font-mono">{filledSlots}/{totalSlots} slots filled</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-700 text-text-primary tracking-tight mb-3">{event.title}</h1>
        {event.description && <p className="text-text-secondary leading-relaxed max-w-2xl mb-4 whitespace-pre-line">{event.description}</p>}
        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {format(new Date(event.startTime), 'EEEE, MMMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {format(new Date(event.startTime), 'HH:mm')} UTC
          </span>
          {event.locationNote && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {event.locationNote}
            </span>
          )}
        </div>
      </div>

      {/* Parties + Signup */}
      <div className="grid lg:grid-cols-[1fr,300px] gap-6 items-start">

        {/* Parties — horizontal, roles diagonal inside */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {event.parties.map((party) => {
              const cap = party.roleSlots.reduce((a, s) => a + s.capacity, 0)
              const fill = party.roleSlots.reduce((a, s) => a + s.assignments.length, 0)
              return (
                <div key={party.id} className="flex-shrink-0 w-52 rounded-xl border border-border bg-bg-surface">
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
                            {(slot as any).notes && (
                              <RoleNoteButton rawNote={(slot as any).notes} roleName={slot.roleName} color={color} />
                            )}
                          </div>
                          {slot.assignments.map(a => {
                            const hasWithdrawn = withdrawnUserIds.has(a.userId)
                            return (
                              <div key={a.id} className={`flex items-center gap-1.5 px-2 py-0.5 ml-3 ${hasWithdrawn ? 'opacity-70' : ''}`}>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasWithdrawn ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <span className={`text-xs truncate ${hasWithdrawn ? 'text-amber-300/80 line-through' : 'text-emerald-300/80'}`}>
                                  {a.user.inGameName || a.user.discordName}
                                </span>
                                {hasWithdrawn && (
                                  <span className="text-xs text-amber-400/60 font-mono flex-shrink-0">withdrew</span>
                                )}
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
                </div>
              )
            })}
          </div>
        </div>

        {/* Signup panel */}
        <div className="space-y-3">
          {mySignup?.assignment && (
            <div className="card p-4 border-emerald-900/50 bg-emerald-950/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Assigned</span>
              </div>
              <p className="text-sm text-text-primary">
                You&apos;re playing <span className="font-semibold text-accent">{mySignup.assignment.roleSlot.roleName}</span>
              </p>
            </div>
          )}

          {event.status === 'PUBLISHED' && session ? (
            <SignupForm
              eventId={params.id}
              parties={event.parties}
              existingSignup={mySignup ? { preferredRoles: mySignup.preferredRoles, note: mySignup.note ?? '' } : null}
              isLocked={false}
              assignedRole={mySignup?.assignment?.roleSlot?.roleName ?? null}
            />
          ) : event.status === 'LOCKED' && session && mySignup ? (
            <SignupForm
              eventId={params.id}
              parties={event.parties}
              existingSignup={{ preferredRoles: mySignup.preferredRoles, note: mySignup.note ?? '' }}
              isLocked={true}
              assignedRole={mySignup?.assignment?.roleSlot?.roleName ?? null}
            />
          ) : !session ? (
            <div className="card p-5 text-center">
              <p className="text-text-secondary text-sm mb-4">Sign in to register for this event</p>
              <a href="/api/auth/signin/discord" className="btn-primary w-full justify-center">Login with Discord</a>
            </div>
          ) : event.status === 'LOCKED' ? (
            <div className="card p-4 text-center">
              <p className="text-amber-400 text-sm font-mono">🔒 Signups closed</p>
            </div>
          ) : event.status === 'COMPLETED' ? (
            <div className="card p-4 text-center">
              <p className="text-text-muted text-sm">This event has ended.</p>
            </div>
          ) : (
            <div className="card p-4 text-center">
              <p className="text-text-muted text-sm">Event not yet published</p>
            </div>
          )}
        </div>
      </div>

      {/* Signed up players list — visible to everyone */}
      {allSignups.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display font-600 text-text-primary text-lg">Signed Up</h2>
            <span className="text-xs font-mono text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full border border-border-subtle">
              {allSignups.length} player{allSignups.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {allSignups.map((signup) => (
              <div
                key={signup.id}
                className={`flex items-start gap-3 p-3 rounded-xl border bg-bg-surface ${
                  signup.user.id === session?.user.id
                    ? 'border-accent/30 bg-accent/5'
                    : 'border-border-subtle'
                }`}
              >
                {/* Avatar */}
                {signup.user.avatarUrl ? (
                  <img src={signup.user.avatarUrl} className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" alt="" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-muted text-sm flex-shrink-0 mt-0.5">
                    {signup.user.discordName[0]?.toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {signup.user.inGameName || signup.user.discordName}
                    </span>
                    {signup.user.id === session?.user.id && (
                      <span className="text-xs text-accent font-mono flex-shrink-0">you</span>
                    )}
                  </div>
                  {/* Preferred roles */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {signup.preferredRoles.map((role) => {
                      const color = getRoleColor(role)
                      return (
                        <span
                          key={role}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono border"
                          style={{ backgroundColor: color + '18', color, borderColor: color + '44' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          {role}
                        </span>
                      )
                    })}
                  </div>
                  {signup.note && (
                    <p className="text-text-muted text-xs mt-1 italic truncate">"{signup.note}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
