import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { LootTabSalesManager } from '@/components/LootTabSalesManager'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function LootTabSalesPage({ params }: Props) {
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

  const sales = await prisma.lootTabSale.findMany({
    where: { guildId: guild.id },
    include: {
      createdBy: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      winner: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">Guild Management</p>
        <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">Loot Tab Sales</h1>
        <p className="text-text-secondary text-sm mt-1">
          Create loot tab sales, view signups, and draw winners.
        </p>
      </div>
      <LootTabSalesManager
        guildSlug={params.slug}
        initialSales={JSON.parse(JSON.stringify(sales))}
      />
    </div>
  )
}
