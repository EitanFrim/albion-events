import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { JoinGuildButton } from '@/components/JoinGuildButton'

interface Props { params: { code: string } }

export default async function JoinGuildPage({ params }: Props) {
  const session = await getServerSession(authOptions)

  const guild = await prisma.guild.findUnique({
    where: { inviteCode: params.code.toUpperCase() },
    include: {
      owner: { select: { discordName: true, inGameName: true } },
      _count: { select: { members: { where: { status: 'ACTIVE' } } } },
    },
  })

  if (!guild) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-700 text-text-primary mb-2">Invalid Invite</h1>
        <p className="text-text-secondary text-sm mb-6">This invite link is invalid or has expired.</p>
        <Link href="/" className="btn-primary">Go Home</Link>
      </div>
    )
  }

  // Already a member?
  if (session?.user?.id) {
    const existing = await prisma.guildMembership.findUnique({
      where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
    })
    if (existing && existing.status === 'ACTIVE') {
      redirect(`/g/${guild.slug}`)
    }
  }

  const leaderName = guild.owner.inGameName ?? guild.owner.discordName

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Guild card */}
        <div className="card p-8 text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚔️</span>
          </div>
          <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">You're invited to join</p>
          <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight mb-1">{guild.name}</h1>
          {guild.description && (
            <p className="text-text-secondary text-sm mt-2 mb-4">{guild.description}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-xs text-text-muted font-mono mt-3">
            <span>👑 {leaderName}</span>
            <span>·</span>
            <span>{guild._count.members} active members</span>
          </div>
        </div>

        {/* Auth / Join */}
        {!session ? (
          <div className="space-y-3 text-center">
            <p className="text-text-secondary text-sm">Sign in with Discord to join this guild.</p>
            <a href={`/api/auth/signin/discord?callbackUrl=/guilds/join/${params.code}`}
              className="btn-primary w-full justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Login with Discord
            </a>
          </div>
        ) : (
          <JoinGuildButton guildName={guild.name} guildSlug={guild.slug} inviteCode={params.code} />
        )}
      </div>
    </div>
  )
}
