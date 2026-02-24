export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { adjustBalance } from '@/lib/balance'
import { sendChannelMessage, formatSilver } from '@/lib/discord'

// POST — Execute the loot split for a drawn sale
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const myAccess = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!myAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch sale with participants
  const sale = await prisma.lootTabSale.findFirst({
    where: { id: params.id, guildId: guild.id },
    include: {
      participants: {
        include: {
          user: { select: { id: true, discordUserId: true, discordName: true, inGameName: true } },
        },
      },
      createdBy: { select: { discordUserId: true } },
    },
  })

  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })

  if (sale.status !== 'DRAWN') {
    return NextResponse.json({ error: 'Sale must be drawn before splitting' }, { status: 400 })
  }

  if (sale.splitCompleted) {
    return NextResponse.json({ error: 'Sale has already been split' }, { status: 400 })
  }

  if (sale.participants.length === 0) {
    return NextResponse.json({ error: 'No participants tagged. Add participants before splitting.' }, { status: 400 })
  }

  // Calculate split: price + silverBags, divided equally
  const totalAmount = sale.price + sale.silverBags
  const participantCount = sale.participants.length
  const perPlayer = Math.floor(totalAmount / participantCount)

  if (perPlayer <= 0) {
    return NextResponse.json({ error: 'Split amount per player would be 0' }, { status: 400 })
  }

  const reason = `Loot tab split: ${sale.description || 'Loot Tab Sale'} (${formatSilver(sale.price)} price + ${formatSilver(sale.silverBags)} silver bags, ${participantCount} players)`

  // Execute balance adjustments for each participant
  const results: Array<{
    userId: string
    displayName: string
    amount: number
    newBalance: number
  }> = []

  for (const participant of sale.participants) {
    // Find the participant's membership in this guild
    const membership = await prisma.guildMembership.findUnique({
      where: {
        userId_guildId: { userId: participant.user.id, guildId: guild.id },
      },
    })

    if (!membership || membership.status !== 'ACTIVE') {
      // Skip inactive members but still continue
      continue
    }

    const result = await adjustBalance({
      membershipId: membership.id,
      amount: perPlayer,
      reason,
      performedById: session.user.id,
    })

    results.push({
      userId: participant.user.id,
      displayName: participant.user.inGameName || participant.user.discordName,
      amount: perPlayer,
      newBalance: result.newBalance,
    })
  }

  // Mark sale as split
  await prisma.lootTabSale.update({
    where: { id: sale.id },
    data: {
      splitCompleted: true,
      splitAt: new Date(),
    },
  })

  // Send Discord notification
  if (sale.channelId) {
    const playerLines = results
      .map(r => `- **${r.displayName}**: +${formatSilver(r.amount)} silver`)
      .join('\n')

    const officerDiscordId = sale.createdBy.discordUserId

    await sendChannelMessage(sale.channelId, {
      content: [
        `**Silver Split Completed!**`,
        ``,
        `**${sale.description || 'Loot Tab Sale'}** — ${formatSilver(totalAmount)} silver split between ${results.length} players:`,
        ``,
        playerLines,
        ``,
        `Performed by <@${(session.user as any).discordId ?? officerDiscordId}>`,
      ].join('\n'),
    })
  }

  return NextResponse.json({
    ok: true,
    totalAmount,
    perPlayer,
    participantCount: results.length,
    results,
  })
}
