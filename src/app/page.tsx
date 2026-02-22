import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GuildSelector } from '@/components/GuildSelector'

export const dynamic = 'force-dynamic'

export default async function HomePage({ searchParams }: { searchParams: { switch?: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="font-display text-4xl font-800 text-text-primary tracking-tight mb-3">
          Albion Events
        </h1>
        <p className="text-text-secondary text-lg mb-8 max-w-sm">
          Guild content management for Albion Online. Coordinate compositions, manage rosters, run content.
        </p>
        <a href="/api/auth/signin/discord" className="btn-primary text-base px-6 py-3 flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Login with Discord
        </a>
      </div>
    )
  }

  // Fetch user's guilds
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

  // If only one active guild and not explicitly switching, redirect straight there
  const activeOnes = memberships.filter(m => m.status === 'ACTIVE')
  if (activeOnes.length === 1 && !searchParams.switch) {
    redirect(`/g/${activeOnes[0].guild.slug}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">Welcome back</p>
        <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight">
          {session.user.inGameName ?? session.user.discordName}
        </h1>
      </div>

      <GuildSelector memberships={memberships as any} />
    </div>
  )
}
