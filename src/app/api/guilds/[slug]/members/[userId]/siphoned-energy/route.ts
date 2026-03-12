export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { adjustSiphonedEnergy } from '@/lib/siphoned-energy'
import { z } from 'zod'

const energySchema = z.object({
  amount: z.number().int().refine(v => v !== 0, 'Amount must be non-zero'),
  reason: z.string().min(1, 'Reason is required').max(200),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const myAccess = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!myAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = energySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { amount, reason } = parsed.data

  const target = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: params.userId, guildId: guild.id } },
    include: { user: { select: { inGameName: true, discordName: true } } },
  })
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  if (target.role === 'OWNER' && myAccess.role !== 'OWNER') {
    return NextResponse.json({ error: "Only the owner can adjust the owner's energy" }, { status: 403 })
  }

  const result = await adjustSiphonedEnergy({
    membershipId: target.id,
    guildId: guild.id,
    playerName: target.user.inGameName || target.user.discordName,
    amount,
    reason,
    performedById: session.user.id,
  })

  return NextResponse.json({
    siphonedEnergy: result.newEnergy,
    transaction: result.transaction,
  })
}
