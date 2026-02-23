export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { adjustBalance } from '@/lib/balance'
import { z } from 'zod'

const playerSchema = z.object({
  membershipId: z.string().min(1),
  amount: z.number().int().positive('Amount must be a positive integer'),
})

const lootSplitSchema = z.object({
  contentName: z.string().min(1, 'Content name is required').max(200),
  soldAmount: z.number().int().nonnegative(),
  repairCost: z.number().int().nonnegative(),
  guildTax: z.number().int().nonnegative(),
  players: z.array(playerSchema).min(1, 'At least one player required'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const myAccess = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!myAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = lootSplitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 })
  }

  const { contentName, soldAmount, repairCost, guildTax, players } = parsed.data

  // Verify all membershipIds belong to this guild
  const membershipIds = players.map(p => p.membershipId)
  const memberships = await prisma.guildMembership.findMany({
    where: { id: { in: membershipIds }, guildId: guild.id },
    include: { user: { select: { id: true, discordName: true, inGameName: true } } },
  })

  if (memberships.length !== membershipIds.length) {
    return NextResponse.json({ error: 'One or more players not found in this guild' }, { status: 400 })
  }

  const membershipMap = new Map(memberships.map(m => [m.id, m]))

  const reason = `Loot split: ${contentName} (${soldAmount.toLocaleString()} sold, ${repairCost.toLocaleString()} repair, ${guildTax.toLocaleString()} tax)`

  // Call adjustBalance for each player sequentially to avoid write contention
  const results: Array<{
    membershipId: string
    displayName: string
    amount: number
    newBalance: number
  }> = []

  for (const player of players) {
    const membership = membershipMap.get(player.membershipId)!
    const result = await adjustBalance({
      membershipId: player.membershipId,
      amount: player.amount,
      reason,
      performedById: session.user.id,
    })
    results.push({
      membershipId: player.membershipId,
      displayName: membership.user.inGameName ?? membership.user.discordName,
      amount: player.amount,
      newBalance: result.newBalance,
    })
  }

  return NextResponse.json({ ok: true, results })
}
