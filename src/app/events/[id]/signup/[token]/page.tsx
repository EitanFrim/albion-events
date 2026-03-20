import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { SignupForm } from '@/components/SignupForm'
import { RegearButton } from '@/components/RegearButton'
import { TokenSignupForm } from '@/components/TokenSignupForm'
import { RoleNoteButton } from '@/components/RoleNoteButton'
import { InlineIgnSetup } from '@/components/InlineIgnSetup'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { EventStatus } from '@prisma/client'

const statusConfig: Record<EventStatus, { label: string; cls: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'badge-gray',  dot: 'bg-text-muted' },
  PUBLISHED: { label: 'Open',      cls: 'badge-green', dot: 'bg-emerald-400 animate-pulse-soft' },
  LOCKED:    { label: 'Locked',    cls: 'badge-amber', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', cls: 'badge-gray',  dot: 'bg-text-muted' },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: { id: string; token: string }
}

export default async function TokenSignupPage({ params }: Props) {
  // Validate token
  const signupToken = await prisma.eventSignupToken.findUnique({
    where: { token: params.token },
  })

  if (!signupToken || signupToken.eventId !== params.id) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-display font-700 text-text-primary text-lg mb-2">Invalid Link</h1>
          <p className="text-text-secondary text-sm">This signup link is invalid. Click the Sign Up button in Discord to get a new one.</p>
        </div>
      </div>
    )
  }

  // Fetch event with parties
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      guild: { select: { name: true, slug: true, serverRegion: true } },
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

  if (event.status !== 'PUBLISHED' && event.status !== 'LOCKED' && event.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <h1 className="font-display font-700 text-text-primary text-lg mb-2">Event Not Available</h1>
          <p className="text-text-secondary text-sm">This event is not open yet.</p>
        </div>
      </div>
    )
  }

  // Find the user linked to this token
  const tokenUser = await prisma.user.findFirst({
    where: { discordUserId: signupToken.discordUserId },
    select: { id: true, inGameName: true },
  })

  const needsIgn = tokenUser && !tokenUser.inGameName

  // Fetch role colors
  const guildRoles = await prisma.guildRole2.findMany({
    where: { guildId: event.guildId },
    include: { category: true },
  })
  const roleColorMap: Record<string, string> = Object.fromEntries(
    guildRoles.map((r: any) => [r.name.toLowerCase(), r.category?.color ?? '#6b7280'])
  )

  // Get withdrawn user IDs for visual indicators
  const allAssignedUserIds = event.parties.flatMap(p => p.roleSlots.flatMap(s => s.assignments.map(a => a.userId)))
  const withdrawnUserIds = new Set(
    allAssignedUserIds.length > 0
      ? (await prisma.signup.findMany({
          where: { eventId: params.id, userId: { in: allAssignedUserIds }, status: 'WITHDRAWN' },
          select: { userId: true },
        })).map(s => s.userId)
      : []
  )

  // Get user's signup and assignment
  type MySignup = { preferredRoles: string[]; note: string | null; assignment: { roleSlot: { roleName: string; notes: string | null } } | null }
  type MyRegear = { id: string; status: string; silverAmount: number | null; reviewNote: string | null; reviewedBy: { discordName: string; inGameName: string | null } | null }

  let mySignup: MySignup | null = null
  let myRegear: MyRegear | null = null

  if (tokenUser) {
    mySignup = await prisma.signup.findFirst({
      where: { eventId: params.id, userId: tokenUser.id, status: 'ACTIVE' },
      include: { assignment: { include: { roleSlot: true } } },
    }) as MySignup | null

    myRegear = await prisma.regearRequest.findUnique({
      where: { eventId_userId: { eventId: params.id, userId: tokenUser.id } },
      select: {
        id: true,
        status: true,
        silverAmount: true,
        reviewNote: true,
        reviewedBy: { select: { discordName: true, inGameName: true } },
      },
    }) as MyRegear | null
  }

  // Fetch all active signups
  const allSignups = await prisma.signup.findMany({
    where: { eventId: params.id, status: 'ACTIVE' },
    include: { user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const sc = statusConfig[event.status]
  const totalSlots = event.parties.reduce((a, p) => a + p.roleSlots.reduce((b, s) => b + s.capacity, 0), 0)
  const filledSlots = event.parties.reduce((a, p) => a + p.roleSlots.reduce((b, s) => b + s.assignments.length, 0), 0)
  const hasSignedUp = !!mySignup
  const isNewUser = !tokenUser

  function getRoleColor(roleName: string) {
    return roleColorMap[roleName.toLowerCase()] ?? '#6b7280'
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <AnimatedPage className="max-w-7xl mx-auto px-4 py-8">
        {/* Guild branding */}
        <div className="flex items-center gap-2 mb-6">
          <a
            href="/"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-bg-elevated, #1f1f23)',
              color: 'var(--color-text-secondary, #a1a1aa)',
              border: '1px solid var(--color-border-subtle, #27272a)',
            }}
          >
            <img src="/images/branding/logo.png" alt="" className="w-4 h-4 object-contain" />
            AlbionHQ
          </a>
          <span className="text-text-muted text-xs">&bull;</span>
          <span className="text-text-secondary text-xs font-medium">{event.guild.name}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`badge ${sc.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            {event.visibility === 'PUBLIC' && (
              <span className="badge badge-green">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Public
              </span>
            )}
            <span className="text-xs text-text-muted font-mono">{filledSlots}/{totalSlots} slots filled</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-700 text-text-primary tracking-tight mb-3">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-text-secondary leading-relaxed max-w-2xl mb-4 whitespace-pre-line">{event.description}</p>
          )}
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

          {/* Party grid */}
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
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                              style={{ backgroundColor: color + '18', borderLeft: `2px solid ${color}` }}>
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
                              const isMe = tokenUser && a.userId === tokenUser.id
                              return (
                                <div key={a.id} className={`flex items-center gap-1.5 px-2 py-0.5 ml-3 rounded ${hasWithdrawn ? 'opacity-70' : ''} ${isMe && !hasWithdrawn ? 'bg-accent/10 ring-1 ring-accent/30 -mx-1 px-3' : ''}`}>
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

            {/* Already signed up — show edit/withdraw (+ IGN prompt if needed) */}
            {event.status === 'PUBLISHED' && tokenUser && hasSignedUp ? (
              <>
                {needsIgn && (
                  <InlineIgnSetup
                    eventId={params.id}
                    token={params.token}
                    serverRegion={event.guild.serverRegion}
                  />
                )}
                <SignupForm
                  eventId={params.id}
                  parties={event.parties}
                  existingSignup={mySignup ? { preferredRoles: mySignup.preferredRoles, note: mySignup.note ?? '' } : null}
                  isLocked={false}
                  authToken={params.token}
                  roleColors={roleColorMap}
                />
              </>
            ) : needsIgn && event.status === 'PUBLISHED' && !hasSignedUp ? (
              <InlineIgnSetup
                eventId={params.id}
                token={params.token}
                serverRegion={event.guild.serverRegion}
              />
            ) : event.status === 'PUBLISHED' && tokenUser && !hasSignedUp ? (
              <SignupForm
                eventId={params.id}
                parties={event.parties}
                existingSignup={null}
                isLocked={false}
                authToken={params.token}
                roleColors={roleColorMap}
              />
            ) : event.status === 'PUBLISHED' && isNewUser ? (
              <TokenSignupForm
                eventId={params.id}
                token={params.token}
                parties={event.parties}
                discordUsername={signupToken.discordUsername}
                roleColors={roleColorMap}
              />
            ) : event.status === 'LOCKED' && tokenUser && mySignup ? (
              <SignupForm
                eventId={params.id}
                parties={event.parties}
                existingSignup={{ preferredRoles: mySignup.preferredRoles, note: mySignup.note ?? '' }}
                isLocked={true}
                authToken={params.token}
                roleColors={roleColorMap}
              />
            ) : event.status === 'LOCKED' ? (
              <div className="card p-4 text-center">
                <p className="text-amber-400 text-sm font-mono">&#x1f512; Signups closed</p>
              </div>
            ) : event.status === 'COMPLETED' ? (
              <div className="card p-4 text-center">
                <p className="text-text-muted text-sm">This content has ended.</p>
              </div>
            ) : null}

            {/* Regear request */}
            {tokenUser &&
              (event.status === 'PUBLISHED' || event.status === 'LOCKED' || event.status === 'COMPLETED') && (
              <RegearButton
                eventId={params.id}
                existingRegear={myRegear as any}
                assignedRole={mySignup?.assignment?.roleSlot ? {
                  roleName: mySignup.assignment.roleSlot.roleName,
                  notes: mySignup.assignment.roleSlot.notes ?? null,
                } : null}
                authToken={params.token}
              />
            )}

            {/* Signed up players list */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-600 text-text-primary text-sm">Signed Up</h3>
                <span className="text-xs font-mono text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full border border-border-subtle">
                  {allSignups.length}
                </span>
              </div>

              {allSignups.length === 0 ? (
                <p className="text-text-muted text-xs italic">No players signed up yet.</p>
              ) : (
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {allSignups.map((signup, index) => {
                    const isMe = tokenUser && signup.user.id === tokenUser.id
                    return (
                      <div
                        key={signup.id}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${
                          isMe
                            ? 'bg-accent/8 border border-accent/20'
                            : 'hover:bg-bg-elevated/50'
                        }`}
                      >
                        {/* Order number */}
                        <span className="text-xs font-mono text-text-muted/50 w-4 text-right flex-shrink-0">
                          {index + 1}
                        </span>

                        {/* Avatar */}
                        {signup.user.avatarUrl ? (
                          <img src={signup.user.avatarUrl} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-muted text-xs flex-shrink-0">
                            {signup.user.discordName[0]?.toUpperCase()}
                          </span>
                        )}

                        {/* Name + roles */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-text-primary truncate">
                              {signup.user.inGameName || signup.user.discordName}
                            </span>
                            {isMe && (
                              <span className="text-xs text-accent font-mono flex-shrink-0">you</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {signup.preferredRoles.map((role) => {
                              const color = getRoleColor(role)
                              return (
                                <span
                                  key={role}
                                  className="inline-flex items-center gap-0.5 px-1 py-0 rounded text-xs font-mono leading-tight"
                                  style={{ backgroundColor: color + '18', color, fontSize: '0.65rem' }}
                                >
                                  <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                  {role}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </AnimatedPage>
    </div>
  )
}
