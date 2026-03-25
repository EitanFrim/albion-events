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

  // No membership — redirect to guild join page
  if (!membership) {
    redirect(`/guilds/join/${guild.inviteCode}`)
  }

  // Query total guild balance across all active members (for officer+ nav)
  const isOfficerPlus = membership.role === 'OWNER' || membership.role === 'OFFICER'
  let totalGuildBalance = 0
  let totalGuildEnergy = 0
  if (isOfficerPlus) {
    const agg = await prisma.guildMembership.aggregate({
      where: { guildId: guild.id, status: 'ACTIVE' },
      _sum: { balance: true, siphonedEnergy: true },
    })
    totalGuildBalance = agg._sum.balance ?? 0
    totalGuildEnergy = agg._sum.siphonedEnergy ?? 0
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

  const themeStyle = guild.accentColor ? { '--accent-override': guild.accentColor } as React.CSSProperties : undefined

  return (
    <div className={`min-h-screen flex flex-col relative ${guild.accentColor ? 'guild-themed' : ''}`} style={themeStyle}>
      {/* 3D Background layers */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-20" />

        {/* Animated ambient glow orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[150px] animate-float"
          style={{ background: 'rgba(124, 58, 237, 0.04)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[130px]"
          style={{ background: 'rgba(244, 63, 94, 0.03)', animationDelay: '2s', animationDuration: '25s' }} />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full blur-[100px]"
          style={{ background: 'rgba(6, 182, 212, 0.02)' }} />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,#0F0F23_100%)]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <GuildNavBar
          guild={{ id: guild.id, name: guild.name, slug: guild.slug, logoUrl: guild.logoUrl, logoZoom: guild.logoZoom, logoPositionX: guild.logoPositionX, logoPositionY: guild.logoPositionY }}
          membership={{ role: membership.role, status: membership.status, balance: membership.balance, siphonedEnergy: membership.siphonedEnergy }}
          totalGuildBalance={totalGuildBalance}
          totalGuildEnergy={totalGuildEnergy}
        />
        {guild.bannerUrl && (
          <div className="relative w-full h-40 overflow-hidden flex-shrink-0">
            <img src={guild.bannerUrl} alt="" className="w-full h-full object-cover" style={{ objectPosition: `center ${guild.bannerPositionY ?? 50}%` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-base" />
            {/* Neon glow line at bottom of banner */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px]"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.4), transparent)' }} />
          </div>
        )}
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
    </div>
  )
}
