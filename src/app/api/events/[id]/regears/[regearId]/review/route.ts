export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { adjustBalance } from '@/lib/balance'
import { z } from 'zod'

const reviewSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('APPROVE'),
    silverAmount: z.number().int().positive('Amount must be a positive integer'),
  }),
  z.object({
    action: z.literal('REJECT'),
    reviewNote: z.string().min(1, 'Rejection reason is required').max(500),
  }),
])

// POST: officer approves or rejects a regear request
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; regearId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, event.guildId, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const regear = await prisma.regearRequest.findUnique({ where: { id: params.regearId } })
  if (!regear || regear.eventId !== params.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (regear.status !== 'PENDING') {
    return NextResponse.json({ error: 'This request has already been reviewed' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  if (parsed.data.action === 'APPROVE') {
    // Add silver to player's balance
    const balanceResult = await adjustBalance({
      membershipId: regear.membershipId,
      amount: parsed.data.silverAmount,
      reason: `Regear approved for "${event.title}"`,
      performedById: session.user.id,
    })

    const updated = await prisma.regearRequest.update({
      where: { id: params.regearId },
      data: {
        status: 'APPROVED',
        silverAmount: parsed.data.silverAmount,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json({ regear: updated, newBalance: balanceResult.newBalance })
  } else {
    const updated = await prisma.regearRequest.update({
      where: { id: params.regearId },
      data: {
        status: 'REJECTED',
        reviewNote: parsed.data.reviewNote,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json({ regear: updated })
  }
}
