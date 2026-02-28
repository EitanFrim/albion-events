export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GuildNavBar } from '@/components/GuildNavBar'
import { BalanceNotifications } from '@/components/BalanceNotifications'
import { AutoRefresh } from '@/components/AutoRefresh'

interface Props {
  children: React.ReactNode
  params: { slug: string }
}

export default async function GuildLayout({ children, params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({
    where: { slug: params.slug },
  })

  if (!guild) notFound()

  let membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })

  // Auto-create GUEST membership for non-members (e.g. arrived via public event link)
  if (!membership) {
    membership = await prisma.guildMembership.create({
      data: {
        userId: session.user.id,
        guildId: guild.id,
        role: 'GUEST',
        status: 'ACTIVE',
      },
    })
  }

  // Query total guild balance across all active members (for officer+ nav)
  const isOfficerPlus = membership.role === 'OWNER' || membership.role === 'OFFICER'
  let totalGuildBalance = 0
  if (isOfficerPlus) {
    const agg = await prisma.guildMembership.aggregate({
      where: { guildId: guild.id, status: 'ACTIVE' },
      _sum: { balance: true },
    })
    totalGuildBalance = agg._sum.balance ?? 0
  }

  // Query unseen balance transactions for notifications (active members only)
  const unseenTransactions = membership.status === 'ACTIVE'
    ? await prisma.balanceTransaction.findMany({
        where: {
          membershipId: membership.id,
          createdAt: { gt: membership.lastSeenBalanceAt },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          balanceAfter: true,
          reason: true,
          createdAt: true,
        },
      })
    : []

  return (
    <div className="min-h-screen flex flex-col">
      <GuildNavBar
        guild={{ id: guild.id, name: guild.name, slug: guild.slug, logoUrl: guild.logoUrl }}
        membership={{ role: membership.role, status: membership.status, balance: membership.balance }}
        totalGuildBalance={totalGuildBalance}
      />
      <BalanceNotifications
        transactions={unseenTransactions.map(t => ({
          id: t.id,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          reason: t.reason,
          createdAt: t.createdAt.toISOString(),
        }))}
        guildSlug={guild.slug}
      />
      {/* <AutoRefresh interval={30000} /> */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
