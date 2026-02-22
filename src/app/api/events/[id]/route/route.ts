import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { z } from 'zod'

const eventInclude = {
  guild: { select: { slug: true } },
  createdBy: { select: { discordName: true, avatarUrl: true } },
  parties: {
    orderBy: { displayOrder: 'asc' as const },
    include: {
      roleSlots: {
        orderBy: { displayOrder: 'asc' as const },
        include: {
          assignments: {
            include: { user: { select: { id: true, discordName: true, avatarUrl: true } } },
          },
        },
      },
    },
  },
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  const event = await prisma.event.findUnique({ where: { id: params.id }, include: eventInclude })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check guild membership for draft visibility
  if (event.status === 'DRAFT') {
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const access = await requireGuildAccess(session.user.id, event.guildId, 'OFFICER')
    if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(event)
}

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  timezone: z.string().optional(),
  locationNote: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'LOCKED', 'COMPLETED']).optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, event.guildId, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (event.status === 'COMPLETED') return NextResponse.json({ error: 'Cannot edit a completed event' }, { status: 400 })

  const body = await req.json()
  const parsed = updateEventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const updated = await prisma.event.update({
    where: { id: params.id },
    data: { ...parsed.data, startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : undefined },
    include: eventInclude,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, event.guildId, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.event.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
