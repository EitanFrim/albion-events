import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { GuildSelector } from '@/components/GuildSelector'

export const dynamic = 'force-dynamic'

export default async function GuildsPage() {
  const session = await getServerSession(authOptions)

  // Not logged in — show guild management overview with login prompt
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
        <div className="mb-8">
          <Link href="/" className="text-xs font-mono text-text-muted hover:text-accent transition-colors mb-4 inline-flex items-center gap-1.5">
            <Image src="/images/branding/logo.png" alt="" width={16} height={16} className="object-contain" />
            AlbionHQ
          </Link>
          <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight mt-4">
            Guild Management
          </h1>
          <p className="text-text-secondary mt-2">
            Plan events, manage compositions, distribute loot, and coordinate your guild with Discord integration.
          </p>
        </div>

        {/* Features overview */}
        <div className="space-y-3 mb-8">
          {[
            { title: 'Event Planning', desc: 'Create events with parties, role slots, and compositions. Members sign up with preferred roles.' },
            { title: 'Drag & Drop Assignments', desc: 'Assign players to composition slots visually. See gear specializations at a glance.' },
            { title: 'Loot Distribution', desc: 'Fair loot tab sales with draw system. Track silver balances and splits for every member.' },
            { title: 'Discord Bot', desc: 'Slash commands for balance checks, loot signups, draws, and notifications right in your server.' },
            { title: 'Audit & Tracking', desc: 'Full audit log, balance history, regear requests, and member activity tracking.' },
          ].map((feature) => (
            <div key={feature.title} className="card p-4 flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{feature.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Login prompt */}
        <div className="card p-6 text-center border-accent/20">
          <p className="text-text-secondary text-sm mb-4">
            Sign in with Discord to create or join a guild.
          </p>
          <a href="/api/auth/signin/discord" className="btn-primary text-base px-6 py-3 inline-flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Continue with Discord
          </a>
        </div>
      </div>
    )
  }

  // Logged in — show guild selector
  const memberships = await prisma.guildMembership.findMany({
    where: { userId: session.user.id },
    include: {
      guild: {
        include: {
          _count: { select: { members: true, events: true } },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-8">
        <Link href="/" className="text-xs font-mono text-text-muted hover:text-accent transition-colors mb-4 inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          AlbionHQ
        </Link>
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1 mt-4">Welcome back</p>
        <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight">
          {session.user.inGameName ?? session.user.discordName}
        </h1>
      </div>

      <GuildSelector memberships={memberships as any} />
    </div>
  )
}
