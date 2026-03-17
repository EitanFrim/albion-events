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

  // Fetch registered members + unlinked player data in parallel
  const [members, pendingBalances, orphanedEnergy] = await Promise.all([
    prisma.guildMembership.findMany({
      where: { guildId: guild.id },
      include: {
        user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      },
      orderBy: [{ status: 'asc' }, { joinedAt: 'asc' }],
    }),
    // Pending balance imports (unlinked players with silver)
    prisma.pendingBalanceImport.findMany({
      where: { guildId: guild.id, appliedAt: null },
      select: { playerName: true, amount: true, createdAt: true },
    }),
    // Orphaned siphoned energy transactions (no membership link)
    prisma.siphonedEnergyTransaction.groupBy({
      by: ['playerName'],
      where: { guildId: guild.id, membershipId: null },
      _sum: { amount: true },
    }),
  ])

  // Merge unlinked data by playerName (case-insensitive)
  const unlinkedMap = new Map<string, { playerName: string; balance: number; siphonedEnergy: number; importedAt: string | null }>()

  for (const pb of pendingBalances) {
    const key = pb.playerName.toLowerCase()
    const existing = unlinkedMap.get(key)
    if (existing) {
      existing.balance += pb.amount
    } else {
      unlinkedMap.set(key, {
        playerName: pb.playerName,
        balance: pb.amount,
        siphonedEnergy: 0,
        importedAt: pb.createdAt.toISOString(),
      })
    }
  }

  for (const oe of orphanedEnergy) {
    const key = oe.playerName.toLowerCase()
    const existing = unlinkedMap.get(key)
    if (existing) {
      existing.siphonedEnergy += oe._sum.amount ?? 0
    } else {
      unlinkedMap.set(key, {
        playerName: oe.playerName,
        balance: 0,
        siphonedEnergy: oe._sum.amount ?? 0,
        importedAt: null,
      })
    }
  }

  const unlinkedPlayers = Array.from(unlinkedMap.values())
    .sort((a, b) => a.playerName.localeCompare(b.playerName))

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
        unlinkedPlayers={unlinkedPlayers}
      />
    </div>
  )
}
