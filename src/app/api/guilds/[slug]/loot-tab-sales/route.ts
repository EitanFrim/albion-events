export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { z } from 'zod'

const createSaleSchema = z.object({
  price: z.number().int().positive('Price must be a positive integer'),
  durationHours: z.number().int().min(1).max(168, 'Duration must be between 1 and 168 hours'),
  description: z.string().max(200).optional(),
  repairCost: z.number().int().nonnegative().optional().default(0),
  silverBags: z.number().int().nonnegative().optional().default(0),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const myAccess = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!myAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')

  const where: Record<string, unknown> = { guildId: guild.id }
  if (statusFilter && ['OPEN', 'DRAWN', 'CANCELLED'].includes(statusFilter)) {
    where.status = statusFilter
  }

  const sales = await prisma.lootTabSale.findMany({
    where,
    include: {
      createdBy: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      winner: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(sales)
}

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
  const parsed = createSaleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 })
  }

  const { price, durationHours, description, repairCost, silverBags } = parsed.data

  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000)

  const sale = await prisma.lootTabSale.create({
    data: {
      guildId: guild.id,
      createdById: session.user.id,
      price,
      durationHours,
      repairCost,
      silverBags,
      description: description || null,
      expiresAt,
    },
    include: {
      createdBy: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      _count: { select: { bids: true } },
    },
  })

  return NextResponse.json(sale, { status: 201 })
}
