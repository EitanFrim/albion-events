export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { adjustBalance } from '@/lib/balance'
import { z } from 'zod'

const balanceSchema = z.object({
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
  const parsed = balanceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { amount, reason } = parsed.data

  // Find target membership
  const target = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: params.userId, guildId: guild.id } },
  })
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Can't adjust owner balance unless you're the owner
  if (target.role === 'OWNER' && myAccess.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only the owner can adjust the owner\'s balance' }, { status: 403 })
  }

  const result = await adjustBalance({
    membershipId: target.id,
    amount,
    reason,
    performedById: session.user.id,
  })

  return NextResponse.json({
    balance: result.newBalance,
    transaction: result.transaction,
  })
}
