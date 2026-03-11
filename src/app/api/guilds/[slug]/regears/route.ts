export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

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

  const eventId = req.nextUrl.searchParams.get('eventId')

  if (eventId) {
    // Return approved regears for a specific event
    const regears = await prisma.regearRequest.findMany({
      where: {
        eventId,
        status: 'APPROVED',
        event: { guildId: guild.id },
      },
      select: {
        id: true,
        membershipId: true,
        userId: true,
        silverAmount: true,
        user: {
          select: { discordName: true, inGameName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(
      regears.map(r => ({
        regearId: r.id,
        membershipId: r.membershipId,
        userId: r.userId,
        displayName: r.user.inGameName || r.user.discordName,
        avatarUrl: r.user.avatarUrl,
        silverAmount: r.silverAmount ?? 0,
      }))
    )
  }

  // Return events that have approved regears
  const events = await prisma.event.findMany({
    where: {
      guildId: guild.id,
      regearRequests: { some: { status: 'APPROVED' } },
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      _count: {
        select: { regearRequests: { where: { status: 'APPROVED' } } },
      },
      regearRequests: {
        where: { status: 'APPROVED' },
        select: { silverAmount: true },
      },
    },
    orderBy: { startTime: 'desc' },
    take: 50,
  })

  return NextResponse.json(
    events.map(e => ({
      eventId: e.id,
      eventTitle: e.title,
      eventDate: e.startTime.toISOString(),
      approvedCount: e._count.regearRequests,
      totalAmount: e.regearRequests.reduce((sum, r) => sum + (r.silverAmount ?? 0), 0),
    }))
  )
}
