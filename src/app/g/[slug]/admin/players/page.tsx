import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { GuildPlayersManager } from '@/components/GuildPlayersManager'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function GuildPlayersPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const myMembership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })

  if (!myMembership || (myMembership.role !== 'OWNER' && myMembership.role !== 'OFFICER')) {
    redirect(`/g/${params.slug}`)
  }

  const members = await prisma.guildMembership.findMany({
    where: { guildId: guild.id },
    include: {
      user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
    },
    orderBy: [{ status: 'asc' }, { joinedAt: 'asc' }],
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <p className="text-[11px] font-mono text-accent uppercase tracking-widest mb-2">Guild Management</p>
        <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight">Players</h1>
        <p className="text-text-secondary text-sm mt-1.5">Manage your guild roster, verify new members, and track balances.</p>
      </div>
      <GuildPlayersManager
        members={members as any}
        guildSlug={params.slug}
        isOwner={myMembership.role === 'OWNER'}
        currentUserId={session.user.id}
      />
    </div>
  )
}
