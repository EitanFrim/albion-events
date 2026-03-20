import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, formatDistanceToNow, subDays } from 'date-fns'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { AnimatedList, AnimatedListItem } from '@/components/motion/AnimatedList'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function GuildHomePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })

  if (!membership || membership.status !== 'ACTIVE') return null

  const isOfficerPlus = membership.role === 'OWNER' || membership.role === 'OFFICER'
  const isOwner = membership.role === 'OWNER'
  const base = `/g/${params.slug}`

  // ── Data queries (parallel) ──
  const oneWeekAgo = subDays(new Date(), 7)

  const [
    memberStats,
    recentMembers,
    upcomingEvents,
    weeklySignups,
    recentBalanceTx,
    recentEnergyTx,
    roleCount,
    templateCount,
    totalEventCount,
  ] = await Promise.all([
    // Member counts
    prisma.guildMembership.groupBy({
      by: ['status'],
      where: { guildId: guild.id },
      _count: true,
    }),
    // Recent members with avatars
    prisma.guildMembership.findMany({
      where: { guildId: guild.id, status: 'ACTIVE' },
      include: { user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } } },
      orderBy: { joinedAt: 'desc' },
      take: 8,
    }),
    // Upcoming events
    prisma.event.findMany({
      where: {
        guildId: guild.id,
        status: { in: ['PUBLISHED', 'LOCKED'] },
        startTime: { gte: new Date() },
      },
      include: {
        parties: { include: { roleSlots: { include: { _count: { select: { assignments: true } } } } } },
        _count: { select: { signups: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 3,
    }),
    // Weekly attendance leaderboard
    prisma.signup.groupBy({
      by: ['userId'],
      where: {
        status: 'ACTIVE',
        event: {
          guildId: guild.id,
          status: { in: ['PUBLISHED', 'LOCKED', 'COMPLETED'] },
          startTime: { gte: oneWeekAgo },
        },
      },
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    }),
    // Recent balance transactions
    prisma.balanceTransaction.findMany({
      where: { membership: { guildId: guild.id } },
      include: { membership: { include: { user: { select: { discordName: true, inGameName: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Recent energy transactions
    prisma.siphonedEnergyTransaction.findMany({
      where: { guildId: guild.id, membershipId: { not: null } },
      include: { membership: { include: { user: { select: { discordName: true, inGameName: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Onboarding: role count
    prisma.guildRole2.count({ where: { guildId: guild.id } }),
    // Onboarding: template count
    prisma.guildTemplate.count({ where: { guildId: guild.id } }),
    // Onboarding: total event count
    prisma.event.count({ where: { guildId: guild.id } }),
  ])

  // Process member stats
  const activeCount = memberStats.find(s => s.status === 'ACTIVE')?._count ?? 0
  const pendingCount = memberStats.find(s => s.status === 'PENDING')?._count ?? 0
  const totalMembers = memberStats.reduce((sum, s) => sum + s._count, 0)

  // Get user info for leaderboard
  const leaderboardUserIds = weeklySignups.map(s => s.userId)
  const leaderboardUsers = leaderboardUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: leaderboardUserIds } },
        select: { id: true, discordName: true, inGameName: true, avatarUrl: true },
      })
    : []
  const userMap = new Map(leaderboardUsers.map(u => [u.id, u]))

  // Merge recent activity
  const recentActivity = [
    ...recentBalanceTx.map(tx => ({
      id: tx.id,
      type: 'silver' as const,
      playerName: tx.membership.user.inGameName || tx.membership.user.discordName,
      amount: tx.amount,
      reason: tx.reason,
      createdAt: tx.createdAt,
    })),
    ...recentEnergyTx.map(tx => ({
      id: tx.id,
      type: 'energy' as const,
      playerName: tx.membership?.user.inGameName || tx.membership?.user.discordName || tx.playerName,
      amount: tx.amount,
      reason: tx.reason,
      createdAt: tx.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

  function getSlotStats(event: typeof upcomingEvents[0]) {
    let total = 0, filled = 0
    for (const party of event.parties)
      for (const slot of party.roleSlots) { total += slot.capacity; filled += slot._count.assignments }
    return { total, filled }
  }

  const medalColors = ['text-amber-400', 'text-gray-300', 'text-amber-600']

  return (
    <AnimatedPage className="max-w-5xl mx-auto px-4 py-8">
      {/* Guild Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={guild.logoUrl || '/images/branding/default-guild-logo.png'}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-800 text-text-primary tracking-tight truncate">
              {guild.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-text-secondary">
                <span className="font-mono text-text-primary">{activeCount}</span> members
              </span>
              {pendingCount > 0 && (
                <span className="text-sm text-amber-400">
                  <span className="font-mono">{pendingCount}</span> pending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist — shown to owners until guild is fully set up */}
      {isOwner && (!guild.discordBotInstalled || !guild.discordGuildId || activeCount < 3 || roleCount === 0 || templateCount === 0 || totalEventCount === 0) && (() => {
        const botInstalled = guild.discordBotInstalled
        const botLinked = !!guild.discordGuildId
        const hasMembers = activeCount >= 3
        const hasRoles = roleCount > 0
        const hasTemplates = templateCount > 0
        const hasEvents = totalEventCount > 0
        const steps = [botInstalled, botLinked, hasMembers, hasRoles, hasTemplates, hasEvents]
        const done = steps.filter(Boolean).length
        const total = steps.length
        const botInviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_APPLICATION_ID}&scope=bot+applications.commands&permissions=8`

        return (
          <div className="card p-6 mb-6 border-accent/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-display text-lg font-700 text-text-primary">Get your guild set up</h2>
                <p className="text-text-muted text-xs">Complete these steps to get the most out of AlbionHQ</p>
              </div>
            </div>
            <div className="space-y-2">
              {/* Step 1: Install Discord Bot */}
              <a href={botInviteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-elevated transition-colors group">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${botInstalled ? 'border-emerald-500 bg-emerald-500/10' : 'border-border'}`}>
                  {botInstalled && <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${botInstalled ? 'text-text-muted line-through' : 'text-text-primary group-hover:text-accent'}`}>
                    Install the Discord bot
                  </span>
                  <p className="text-xs text-text-muted">Add the AlbionHQ bot to your Discord server</p>
                </div>
                {!botInstalled && (
                  <svg className="w-4 h-4 text-text-muted group-hover:text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </a>

              {/* Step 2: Link with /setup */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${botLinked ? 'border-emerald-500 bg-emerald-500/10' : 'border-border'}`}>
                  {botLinked && <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${botLinked ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                    Run <code className="px-1.5 py-0.5 rounded bg-bg-overlay text-accent text-xs font-mono">/setup</code> in Discord
                  </span>
                  <p className="text-xs text-text-muted">Link your Discord server and set the member role for registration</p>
                </div>
              </div>

              {/* Step 3: Post registration button */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${hasMembers ? 'border-emerald-500 bg-emerald-500/10' : 'border-border'}`}>
                  {hasMembers && <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${hasMembers ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                    Run <code className="px-1.5 py-0.5 rounded bg-bg-overlay text-accent text-xs font-mono">/verify-message</code> to post registration button
                  </span>
                  <p className="text-xs text-text-muted">Members click the button in Discord to register to the guild</p>
                </div>
                {hasMembers && <span className="text-xs font-mono text-emerald-400">{activeCount} members</span>}
              </div>

              {/* Step 4: Create roles */}
              <Link href={`${base}/admin/roles`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-elevated transition-colors group">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${hasRoles ? 'border-emerald-500 bg-emerald-500/10' : 'border-border'}`}>
                  {hasRoles && <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${hasRoles ? 'text-text-muted line-through' : 'text-text-primary group-hover:text-accent'}`}>
                    Create weapon roles
                  </span>
                  <p className="text-xs text-text-muted">Set up role categories (Tank, Healer, DPS) and add weapons to each</p>
                </div>
                {hasRoles && <span className="text-xs font-mono text-emerald-400">{roleCount}</span>}
              </Link>

              {/* Step 5: Build a comp template */}
              <Link href={`${base}/admin/templates`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-elevated transition-colors group">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${hasTemplates ? 'border-emerald-500 bg-emerald-500/10' : 'border-border'}`}>
                  {hasTemplates && <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${hasTemplates ? 'text-text-muted line-through' : 'text-text-primary group-hover:text-accent'}`}>
                    Build a composition template
                  </span>
                  <p className="text-xs text-text-muted">Create reusable party compositions like &quot;10v10 ZvZ&quot; or &quot;5v5 HG&quot;</p>
                </div>
                {hasTemplates && <span className="text-xs font-mono text-emerald-400">{templateCount}</span>}
              </Link>

              {/* Step 6: Create first event */}
              <Link href={`${base}/admin/events/new`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-elevated transition-colors group">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${hasEvents ? 'border-emerald-500 bg-emerald-500/10' : 'border-border'}`}>
                  {hasEvents && <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${hasEvents ? 'text-text-muted line-through' : 'text-text-primary group-hover:text-accent'}`}>
                    Create your first event
                  </span>
                  <p className="text-xs text-text-muted">Schedule a ZvZ, ganking session, or any content for your guild</p>
                </div>
                {hasEvents && <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </Link>
            </div>

            {/* Progress bar */}
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                <span>{done}/{total} completed</span>
                <span className="font-mono">{Math.round((done / total) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-bg-overlay rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${(done / total) * 100}%` }} />
              </div>
            </div>
          </div>
        )
      })()}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column — events + leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Events */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest">Upcoming Events</h2>
              </div>
              <Link href={base} className="text-xs text-text-muted hover:text-accent transition-colors">
                View all →
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="card p-6 text-center text-text-muted text-sm">
                No upcoming events scheduled.
                {isOfficerPlus && (
                  <Link href={`${base}/admin/events/new`} className="block mt-2 text-accent hover:text-accent/80">
                    Create one →
                  </Link>
                )}
              </div>
            ) : (
              <AnimatedList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map(event => {
                  const { total, filled } = getSlotStats(event)
                  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
                  return (
                    <AnimatedListItem key={event.id}>
                    <Link href={`${base}/events/${event.id}`}
                      className="card p-4 hover:border-border hover:shadow-card-hover hover:-translate-y-0.5 transition-all group block">
                      <span className="text-xs text-text-muted font-mono">{format(new Date(event.startTime), 'MMM d · HH:mm')}</span>
                      <h3 className="font-display font-600 text-text-primary group-hover:text-accent transition-colors text-sm mt-1 mb-2 leading-snug line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-text-muted">{event._count.signups} signed up</span>
                        <span className="text-text-secondary font-mono">{filled}/{total}</span>
                      </div>
                      <div className="h-1 bg-bg-overlay rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-accent'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                    </AnimatedListItem>
                  )
                })}
              </AnimatedList>
            )}
          </section>

          {/* Weekly Attendance Leaderboard */}
          <ScrollReveal delay={0.1}>
          <section>
            <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-3">
              Weekly Attendance
            </h2>
            {weeklySignups.length === 0 ? (
              <div className="card p-6 text-center text-text-muted text-sm">
                No signups this week yet.
              </div>
            ) : (
              <div className="card divide-y divide-border-subtle">
                {weeklySignups.map((entry, i) => {
                  const user = userMap.get(entry.userId)
                  if (!user) return null
                  const displayName = user.inGameName || user.discordName
                  return (
                    <div key={entry.userId} className="flex items-center gap-3 px-4 py-3">
                      {/* Rank */}
                      <div className="w-6 text-center flex-shrink-0">
                        {i < 3 ? (
                          <span className={`text-sm font-bold ${medalColors[i]}`}>
                            {i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-text-muted">#{i + 1}</span>
                        )}
                      </div>
                      {/* Avatar */}
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full border border-border flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                          <span className="text-text-muted text-[10px] font-mono">{displayName[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      {/* Name */}
                      <span className="text-sm text-text-primary flex-1 truncate">{displayName}</span>
                      {/* Count */}
                      <span className="text-sm font-mono text-accent font-medium">{entry._count}</span>
                      <span className="text-xs text-text-muted">signups</span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
          </ScrollReveal>
        </div>

        {/* Right column — members, activity, quick links */}
        <div className="space-y-6">
          {/* Members Overview */}
          <ScrollReveal delay={0.15}>
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest">Members</h2>
              {isOfficerPlus && (
                <Link href={`${base}/admin/players`} className="text-xs text-text-muted hover:text-accent transition-colors">
                  Manage →
                </Link>
              )}
            </div>
            <div className="card p-4">
              <div className="flex items-center -space-x-2 mb-3">
                {recentMembers.map(m => (
                  m.user.avatarUrl ? (
                    <img key={m.id} src={m.user.avatarUrl} alt="" className="w-8 h-8 rounded-full border-2 border-bg-surface" title={m.user.inGameName || m.user.discordName} />
                  ) : (
                    <div key={m.id} className="w-8 h-8 rounded-full bg-bg-elevated border-2 border-bg-surface flex items-center justify-center" title={m.user.inGameName || m.user.discordName}>
                      <span className="text-text-muted text-[10px] font-mono">{(m.user.inGameName || m.user.discordName)[0]?.toUpperCase()}</span>
                    </div>
                  )
                ))}
                {activeCount > 8 && (
                  <div className="w-8 h-8 rounded-full bg-bg-elevated border-2 border-bg-surface flex items-center justify-center">
                    <span className="text-text-muted text-[10px] font-mono">+{activeCount - 8}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-text-muted">
                <span className="text-text-primary font-mono">{activeCount}</span> active
                {pendingCount > 0 && <> · <span className="text-amber-400 font-mono">{pendingCount}</span> pending</>}
              </p>
            </div>
          </section>
          </ScrollReveal>

          {/* Recent Activity */}
          <ScrollReveal delay={0.2}>
          <section>
            <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-3">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <div className="card p-4 text-center text-text-muted text-xs">No recent activity.</div>
            ) : (
              <div className="space-y-1.5">
                {recentActivity.map(tx => (
                  <div key={tx.id} className="card px-3 py-2.5 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tx.type === 'silver' ? 'bg-amber-400' : 'bg-teal-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-text-primary truncate">{tx.playerName}</span>
                        <span className={`text-xs font-mono font-medium ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-text-muted">{tx.type === 'silver' ? 'silver' : 'energy'}</span>
                      </div>
                      {tx.reason && <p className="text-[10px] text-text-muted truncate">{tx.reason}</p>}
                    </div>
                    <span className="text-[10px] text-text-muted flex-shrink-0">
                      {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
          </ScrollReveal>

          {/* Quick Links */}
          <ScrollReveal delay={0.25}>
          <section>
            <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-3">Quick Links</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link href={`${base}/my-balance`} className="card px-3 py-2.5 text-xs text-text-secondary hover:text-amber-400 hover:border-amber-500/20 transition-colors flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                My Balance
              </Link>
              <Link href={`${base}/my-siphoned-energy`} className="card px-3 py-2.5 text-xs text-text-secondary hover:text-teal-400 hover:border-teal-500/20 transition-colors flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                My Energy
              </Link>
              <Link href={`${base}/guide`} className="card px-3 py-2.5 text-xs text-text-secondary hover:text-text-primary hover:border-border transition-colors flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                How To
              </Link>
              {isOfficerPlus && (
                <>
                  <Link href={`${base}/admin/players`} className="card px-3 py-2.5 text-xs text-text-secondary hover:text-text-primary hover:border-border transition-colors flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    Players
                  </Link>
                  <Link href={`${base}/admin/loot-split`} className="card px-3 py-2.5 text-xs text-text-secondary hover:text-text-primary hover:border-border transition-colors flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Loot Split
                  </Link>
                </>
              )}
            </div>
          </section>
          </ScrollReveal>
        </div>
      </div>
    </AnimatedPage>
  )
}
