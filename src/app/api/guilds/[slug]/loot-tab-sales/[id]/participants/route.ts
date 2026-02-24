export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { z } from 'zod'

// GET — List participants for a sale
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
  })
  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })

  const participants = await prisma.lootTabParticipant.findMany({
    where: { saleId: sale.id },
    include: {
      user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      addedBy: { select: { id: true, discordName: true, inGameName: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(participants)
}

// POST — Add participants by in-game name
const addSchema = z.object({
  players: z.array(z.string().min(1).max(64)).min(1, 'At least one player name required'),
})

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

  const sale = await prisma.lootTabSale.findFirst({
    where: { id: params.id, guildId: guild.id },
  })
  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })

  if (sale.status !== 'DRAWN') {
    return NextResponse.json({ error: 'Can only add participants to drawn sales' }, { status: 400 })
  }
  if (sale.splitCompleted) {
    return NextResponse.json({ error: 'Sale has already been split' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 })
  }

  // Get all active guild members
  const allMembers = await prisma.guildMembership.findMany({
    where: { guildId: guild.id, status: 'ACTIVE' },
    include: { user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } } },
  })

  // Build case-insensitive name map
  const nameMap = new Map<string, typeof allMembers[0]>()
  for (const m of allMembers) {
    if (m.user.inGameName) {
      nameMap.set(m.user.inGameName.toLowerCase(), m)
    }
  }

  const added: Array<{ userId: string; displayName: string }> = []
  const notFound: string[] = []
  const alreadyTagged: string[] = []

  for (const name of parsed.data.players) {
    const member = nameMap.get(name.trim().toLowerCase())
    if (!member) {
      notFound.push(name)
      continue
    }

    try {
      await prisma.lootTabParticipant.create({
        data: {
          saleId: sale.id,
          userId: member.user.id,
          addedById: session.user.id,
        },
      })
      added.push({
        userId: member.user.id,
        displayName: member.user.inGameName || member.user.discordName,
      })
    } catch (err: any) {
      // Unique constraint violation — already tagged
      if (err.code === 'P2002') {
        alreadyTagged.push(member.user.inGameName || member.user.discordName)
      } else {
        throw err
      }
    }
  }

  return NextResponse.json({ added, notFound, alreadyTagged })
}
