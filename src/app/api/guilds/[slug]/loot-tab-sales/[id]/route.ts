export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

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
      participants: {
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

export async function DELETE(
  _req: NextRequest,
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
    select: { id: true, status: true, splitCompleted: true, channelId: true, messageId: true },
  })

  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })

  // Block deletion of sales that have already been split (silver was distributed)
  if (sale.splitCompleted) {
    return NextResponse.json(
      { error: 'Cannot delete a sale that has already been split. The silver has been distributed.' },
      { status: 400 }
    )
  }

  // Try to delete the Discord message (non-critical)
  if (sale.channelId && sale.messageId) {
    try {
      await fetch(
        `${DISCORD_API_BASE}/channels/${sale.channelId}/messages/${sale.messageId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
        }
      )
    } catch {
      // Non-critical — message may already be deleted
    }
  }

  // Delete the sale (cascades to bids and participants)
  await prisma.lootTabSale.delete({ where: { id: sale.id } })

  return NextResponse.json({ ok: true })
}
