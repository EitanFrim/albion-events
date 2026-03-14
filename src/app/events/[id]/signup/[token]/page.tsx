import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { TokenSignupForm } from '@/components/TokenSignupForm'

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

  if (signupToken.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-display font-700 text-text-primary text-lg mb-2">Link Expired</h1>
          <p className="text-text-secondary text-sm">This signup link has expired. Click the Sign Up button in Discord to get a new one.</p>
        </div>
      </div>
    )
  }

  // Check if already used — but show a friendly message
  if (signupToken.usedAt) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display font-700 text-text-primary text-lg mb-2">Already Signed Up</h1>
          <p className="text-text-secondary text-sm">You&apos;ve already used this link to sign up. See you at the event!</p>
        </div>
      </div>
    )
  }

  // Fetch event with parties
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      guild: { select: { name: true, slug: true } },
      parties: {
        orderBy: { displayOrder: 'asc' },
        include: {
          roleSlots: {
            orderBy: { displayOrder: 'asc' },
            include: {
              assignments: true,
            },
          },
        },
      },
    },
  })

  if (!event) notFound()

  if (event.status !== 'PUBLISHED') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <h1 className="font-display font-700 text-text-primary text-lg mb-2">Event Closed</h1>
          <p className="text-text-secondary text-sm">This event is no longer open for signups.</p>
        </div>
      </div>
    )
  }

  // Fetch role colors
  const guildRoles = await prisma.guildRole2.findMany({
    where: { guildId: event.guildId },
    include: { category: true },
  })
  const roleColorMap: Record<string, string> = Object.fromEntries(
    guildRoles.map((r: any) => [r.name.toLowerCase(), r.category?.color ?? '#6b7280'])
  )

  const totalSlots = event.parties.reduce((a, p) => a + p.roleSlots.reduce((b, s) => b + s.capacity, 0), 0)
  const filledSlots = event.parties.reduce((a, p) => a + p.roleSlots.reduce((b, s) => b + s.assignments.length, 0), 0)

  function getRoleColor(roleName: string) {
    return roleColorMap[roleName.toLowerCase()] ?? '#6b7280'
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
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
          <span className="text-text-muted text-xs">•</span>
          <span className="text-text-secondary text-xs font-medium">{event.guild.name}</span>
        </div>

        {/* Event header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-700 text-text-primary tracking-tight mb-2">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-text-secondary text-sm leading-relaxed mb-4 whitespace-pre-line">{event.description}</p>
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
            <span className="text-xs text-text-muted font-mono">{filledSlots}/{totalSlots} slots filled</span>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr,300px] gap-6 items-start">
          {/* Party grid */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {event.parties.map((party) => {
                const cap = party.roleSlots.reduce((a, s) => a + s.capacity, 0)
                const fill = party.roleSlots.reduce((a, s) => a + s.assignments.length, 0)
                return (
                  <div key={party.id} className="flex-shrink-0 w-48 rounded-xl border border-border bg-bg-surface">
                    <div className="px-3 py-2 border-b border-border-subtle flex items-center justify-between rounded-t-xl bg-bg-elevated">
                      <span className="font-display font-600 text-text-primary text-xs tracking-wide truncate">{party.name}</span>
                      <span className="text-xs font-mono text-text-muted ml-2 flex-shrink-0">{fill}/{cap}</span>
                    </div>
                    <div className="p-2 space-y-0.5">
                      {party.roleSlots.map((slot) => {
                        const color = getRoleColor(slot.roleName)
                        const isFilled = slot.assignments.length >= slot.capacity
                        return (
                          <div key={slot.id}>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                              style={{ backgroundColor: color + '18', borderLeft: `2px solid ${color}` }}>
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isFilled ? 'opacity-60' : ''}`} style={{ backgroundColor: color }} />
                              <span className={`font-mono font-semibold truncate ${isFilled ? 'opacity-60' : ''}`} style={{ color }}>{slot.roleName}</span>
                              <span className={`font-mono text-text-muted ml-auto flex-shrink-0 text-xs ${isFilled ? 'opacity-60' : ''}`}>
                                {slot.assignments.length}/{slot.capacity}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Signup form */}
          <TokenSignupForm
            eventId={params.id}
            token={params.token}
            parties={event.parties}
            discordUsername={signupToken.discordUsername}
            roleColors={roleColorMap}
          />
        </div>
      </div>
    </div>
  )
}
