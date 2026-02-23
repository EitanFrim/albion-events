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
import { ExportPlayersButton } from '@/components/ExportPlayersButton'
import { RegearButton } from '@/components/RegearButton'
import { EventStatus } from '@prisma/client'

const statusConfig: Record<EventStatus, { label: string; cls: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'badge-gray',  dot: 'bg-text-muted' },
  PUBLISHED: { label: 'Open',      cls: 'badge-green', dot: 'bg-emerald-400 animate-pulse-soft' },
  LOCKED:    { label: 'Locked',    cls: 'badge-amber', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', cls: 'badge-gray',  dot: 'bg-text-muted' },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props { params: { slug: string; id: string } }

export default async function GuildEventPage({ params }: Props) {
  const session = await getServerSession(authOptions)

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const membership = session ? await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  }) : null

  const isOfficerPlus = membership?.role === 'OWNER' || membership?.role === 'OFFICER'

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

  if (!event || event.guildId !== guild.id) notFound()
  if (event.status === 'DRAFT' && !isOfficerPlus) notFound()

  const guildRoles = await prisma.guildRole2.findMany({
    where: { guildId: guild.id },
    include: { category: true },
  })
  const roleColorMap: Record<string, string> = Object.fromEntries(
    guildRoles.map((r: any) => [r.name.toLowerCase(), r.category?.color ?? '#6b7280'])
  )

  const allAssignedUserIds = event.parties.flatMap(p => p.roleSlots.flatMap(s => s.assignments.map(a => a.userId)))
  const withdrawnUserIds = new Set(
    allAssignedUserIds.length > 0
      ? (await prisma.signup.findMany({
          where: { eventId: params.id, userId: { in: allAssignedUserIds }, status: 'WITHDRAWN' },
          select: { userId: true },
        })).map(s => s.userId)
      : []
  )

  let mySignup = null
  if (session?.user.id && membership?.status === 'ACTIVE') {
    mySignup = await prisma.signup.findFirst({
      where: { eventId: params.id, userId: session.user.id, status: 'ACTIVE' },
      include: { assignment: { include: { roleSlot: true } } },
    })
  }

  // Fetch current user's regear request for this event
  let myRegear = null
  if (session?.user.id && membership?.status === 'ACTIVE') {
    myRegear = await prisma.regearRequest.findUnique({
      where: { eventId_userId: { eventId: params.id, userId: session.user.id } },
      select: {
        id: true,
        status: true,
        silverAmount: true,
        reviewNote: true,
        reviewedBy: { select: { discordName: true, inGameName: true } },
      },
    })
  }

  // Count pending regears for officer badge
  let pendingRegearCount = 0
  if (isOfficerPlus) {
    pendingRegearCount = await prisma.regearRequest.count({
      where: { eventId: params.id, status: 'PENDING' },
    })
  }

  // Fetch all active signups (visible to everyone)
  const allSignups = await prisma.signup.findMany({
    where: { eventId: params.id, status: 'ACTIVE' },
    include: { user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  })

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
        <Link href={`/g/${params.slug}`} className="btn-ghost text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Events
        </Link>
        {isOfficerPlus && (
          <>
            <Link href={`/g/${params.slug}/admin/events/${params.id}/edit`} className="btn-ghost text-xs">Edit</Link>
            <Link href={`/g/${params.slug}/admin/events/${params.id}/assign`} className="btn-secondary text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Assign Players
            </Link>
            <PublishEventButton eventId={params.id} currentStatus={event.status} />
            {event.status !== 'COMPLETED' && <CompleteEventButton eventId={params.id} guildSlug={params.slug} />}
            <ExportPlayersButton
              eventTitle={event.title}
              parties={event.parties as any}
              signups={allSignups as any}
            />
            <Link href={`/g/${params.slug}/events/${params.id}/regears`} className="btn-ghost text-xs relative">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Regears
              {pendingRegearCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 bg-amber-400 text-bg-base rounded-full text-xs flex items-center justify-center font-bold px-1">
                  {pendingRegearCount}
                </span>
              )}
            </Link>
            <DeleteEventButton eventId={params.id} eventTitle={event.title} guildSlug={params.slug} />
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
                            return (
                              <div key={a.id} className={`flex items-center gap-1.5 px-2 py-0.5 ml-3 ${hasWithdrawn ? 'opacity-70' : ''}`}>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasWithdrawn ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <span className={`text-xs truncate ${hasWithdrawn ? 'text-amber-300/80 line-through' : 'text-emerald-300/80'}`}>
                                  {a.user.inGameName || a.user.discordName}
                                </span>
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

          {event.status === 'PUBLISHED' && session && membership?.status === 'ACTIVE' ? (
            <SignupForm
              eventId={params.id}
              parties={event.parties}
              existingSignup={mySignup ? { preferredRoles: mySignup.preferredRoles, note: mySignup.note ?? '' } : null}
              isLocked={false}
            />
          ) : event.status === 'LOCKED' && session && mySignup ? (
            <SignupForm
              eventId={params.id}
              parties={event.parties}
              existingSignup={{ preferredRoles: mySignup.preferredRoles, note: mySignup.note ?? '' }}
              isLocked={true}
            />
          ) : !session ? (
            <div className="card p-5 text-center">
              <p className="text-text-secondary text-sm mb-4">Sign in to register for this content</p>
              <a href="/api/auth/signin/discord" className="btn-primary w-full justify-center">Login with Discord</a>
            </div>
          ) : membership?.status === 'PENDING' ? (
            <div className="card p-4 text-center">
              <p className="text-amber-400 text-sm">Your membership is pending verification.</p>
            </div>
          ) : event.status === 'LOCKED' ? (
            <div className="card p-4 text-center">
              <p className="text-amber-400 text-sm font-mono">🔒 Signups closed</p>
            </div>
          ) : event.status === 'COMPLETED' ? (
            <div className="card p-4 text-center">
              <p className="text-text-muted text-sm">This content has ended.</p>
            </div>
          ) : (
            <div className="card p-4 text-center">
              <p className="text-text-muted text-sm">Content not yet published</p>
            </div>
          )}

          {/* Regear request - show for active members on locked/completed events */}
          {session && membership?.status === 'ACTIVE' &&
            (event.status === 'LOCKED' || event.status === 'COMPLETED') && (
            <RegearButton
              eventId={params.id}
              existingRegear={myRegear as any}
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
                {allSignups.map((signup, index) => (
                  <div
                    key={signup.id}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${
                      signup.user.id === session?.user.id
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
                        {signup.user.id === session?.user.id && (
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
