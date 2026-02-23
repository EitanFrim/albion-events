export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

// GET: fetch a single regear request with screenshot (lazy-load for officers)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; regearId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const regear = await prisma.regearRequest.findUnique({
    where: { id: params.regearId },
    include: {
      user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      reviewedBy: { select: { id: true, discordName: true, inGameName: true } },
    },
  })

  if (!regear || regear.eventId !== params.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Allow: the request owner or an officer+
  const isOwner = regear.userId === session.user.id
  const isOfficer = await requireGuildAccess(session.user.id, event.guildId, 'OFFICER')
  if (!isOwner && !isOfficer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(regear)
}
