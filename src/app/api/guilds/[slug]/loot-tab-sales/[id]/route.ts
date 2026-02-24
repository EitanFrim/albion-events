export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const myAccess = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!myAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sale = await prisma.lootTabSale.findFirst({
    where: { id: params.id, guildId: guild.id },
    include: {
      createdBy: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      winner: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      bids: {
        include: {
          user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })

  return NextResponse.json(sale)
}
