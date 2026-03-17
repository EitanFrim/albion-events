export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { resolveUser } from '@/lib/token-auth'

// GET: fetch a single regear request with screenshot (lazy-load for officers or owner)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; regearId: string } }
) {
  const user = await resolveUser(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  const isOwner = regear.userId === user.id
  const isOfficer = await requireGuildAccess(user.id, event.guildId, 'OFFICER')
  if (!isOwner && !isOfficer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(regear)
}
