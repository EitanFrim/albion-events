import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { EventStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const statusConfig: Record<EventStatus, { label: string; cls: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'badge-gray',  dot: 'bg-text-muted' },
  PUBLISHED: { label: 'Open',      cls: 'badge-green', dot: 'bg-emerald-400' },
  LOCKED:    { label: 'Locked',    cls: 'badge-amber', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', cls: 'badge-gray',  dot: 'bg-text-muted' },
}

interface Props { params: { slug: string } }

export default async function GuildHomePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })

  const isOfficerPlus = membership?.role === 'OWNER' || membership?.role === 'OFFICER'
  const isGuest = membership?.role === 'GUEST'
  const isActive = membership?.status === 'ACTIVE'

  const events = await prisma.event.findMany({
    where: {
      guildId: guild.id,
      ...(isOfficerPlus ? {} : { status: { in: ['PUBLISHED', 'LOCKED', 'COMPLETED'] } }),
      ...(isGuest ? { visibility: 'PUBLIC' } : {}),
    },
    include: {
      parties: { include: { roleSlots: { include: { _count: { select: { assignments: true } } } } } },
      _count: { select: { signups: true } },
    },
    orderBy: { startTime: 'asc' },
  })

  const active = events.filter(e => e.status !== 'COMPLETED')
  const past = events.filter(e => e.status === 'COMPLETED')

  function getSlotStats(event: typeof events[0]) {
    let total = 0, filled = 0
    for (const party of event.parties)
      for (const slot of party.roleSlots) { total += slot.capacity; filled += slot._count.assignments }
    return { total, filled }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">{guild.name}</p>
          <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight">Contents</h1>
        </div>
        {isOfficerPlus && (
          <Link href={`/g/${params.slug}/admin/events/new`} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Content
          </Link>
        )}
      </div>

      {/* Pending state */}
      {!isActive && (
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-display font-600 text-text-primary mb-2">Awaiting Verification</h2>
          <p className="text-text-secondary text-sm">
            An Officer or the Guild Owner needs to verify your membership before you can participate in events.
          </p>
        </div>
      )}

      {isActive && active.length === 0 && past.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-text-secondary text-sm">No events scheduled yet.</p>
          {isOfficerPlus && (
            <Link href={`/g/${params.slug}/admin/events/new`} className="btn-primary mt-4 inline-flex">
              Create First Event
            </Link>
          )}
        </div>
      )}

      {isActive && (active.length > 0 || past.length > 0) && (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                <span className="text-xs font-mono text-text-muted uppercase tracking-widest">Upcoming</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {active.map(event => {
                  const { total, filled } = getSlotStats(event)
                  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
                  const sc = statusConfig[event.status]
                  return (
                    <Link key={event.id} href={`/g/${params.slug}/events/${event.id}`} prefetch={false}
                      className="card p-4 hover:border-border hover:shadow-card-hover transition-all duration-200 group block">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`badge ${sc.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                          {event.visibility === 'PUBLIC' && (
                            <span className="badge badge-green text-[10px]">Public</span>
                          )}
                        </div>
                        <span className="text-xs text-text-muted font-mono">{format(new Date(event.startTime), 'MMM d')}</span>
                      </div>
                      <h3 className="font-display font-600 text-text-primary group-hover:text-accent transition-colors text-base leading-snug mb-1">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-text-secondary text-xs line-clamp-2 mb-3">{event.description}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-border-subtle">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-text-muted">{format(new Date(event.startTime), 'HH:mm')} UTC</span>
                          <span className="text-text-secondary font-mono">{filled}/{total} slots</span>
                        </div>
                        <div className="h-1 bg-bg-overlay rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-accent'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-text-muted mt-1.5">{event._count.signups} signed up</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                <span className="text-xs font-mono text-text-muted uppercase tracking-widest">Past Content</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {past.map(event => (
                  <Link key={event.id} href={`/g/${params.slug}/events/${event.id}`} prefetch={false}
                    className="flex items-center justify-between px-4 py-3 card hover:border-border transition-all opacity-60 hover:opacity-100">
                    <span className="text-sm text-text-secondary font-medium truncate">{event.title}</span>
                    <span className="text-xs text-text-muted font-mono flex-shrink-0 ml-3">
                      {format(new Date(event.startTime), 'MMM d')}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
