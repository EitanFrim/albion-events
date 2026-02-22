import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guildSlug = req.nextUrl.searchParams.get('guildSlug')

  if (guildSlug) {
    const guild = await prisma.guild.findUnique({ where: { slug: guildSlug } })
    if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
    const access = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
    if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const memberships = await prisma.guildMembership.findMany({
      where: { guildId: guild.id, status: 'ACTIVE' },
      include: { user: { select: { id: true, discordName: true, inGameName: true } } },
    })
    return NextResponse.json(memberships.map(m => m.user))
  }

  // Legacy fallback
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const users = await prisma.user.findMany({ select: { id: true, discordName: true, inGameName: true } })
  return NextResponse.json(users)
}
