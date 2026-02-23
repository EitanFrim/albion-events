export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

// POST: player submits a regear request (FormData with screenshot)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Must be an active guild member
  const membership = await requireGuildAccess(session.user.id, event.guildId, 'PLAYER')
  if (!membership) return NextResponse.json({ error: 'Must be a verified guild member' }, { status: 403 })

  // Parse FormData
  const formData = await req.formData()
  const file = formData.get('screenshot') as File | null
  const note = (formData.get('note') as string | null) ?? ''

  if (!file) return NextResponse.json({ error: 'Screenshot is required' }, { status: 400 })

  // Validate file type and size (5 MB limit)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Screenshot must be under 5 MB' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 })

  // Convert to base64 data URL
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')
  const screenshotData = `data:${file.type};base64,${base64}`

  // Check for existing request
  const existing = await prisma.regearRequest.findUnique({
    where: { eventId_userId: { eventId: params.id, userId: session.user.id } },
  })

  // If rejected, allow resubmission by updating the existing record
  if (existing && existing.status === 'REJECTED') {
    const updated = await prisma.regearRequest.update({
      where: { id: existing.id },
      data: {
        screenshotData,
        note: note.slice(0, 500) || null,
        status: 'PENDING',
        silverAmount: null,
        reviewNote: null,
        reviewedById: null,
        reviewedAt: null,
      },
    })
    return NextResponse.json({ id: updated.id, status: updated.status })
  }

  if (existing) return NextResponse.json({ error: 'You already have a regear request for this event' }, { status: 409 })

  const regear = await prisma.regearRequest.create({
    data: {
      eventId: params.id,
      userId: session.user.id,
      membershipId: membership.id,
      screenshotData,
      note: note.slice(0, 500) || null,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ id: regear.id, status: regear.status }, { status: 201 })
}

// GET: officer lists all regear requests for an event (no screenshot data)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, event.guildId, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const requests = await prisma.regearRequest.findMany({
    where: { eventId: params.id },
    select: {
      id: true,
      status: true,
      note: true,
      silverAmount: true,
      reviewNote: true,
      createdAt: true,
      reviewedAt: true,
      user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      reviewedBy: { select: { id: true, discordName: true, inGameName: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ items: requests })
}
