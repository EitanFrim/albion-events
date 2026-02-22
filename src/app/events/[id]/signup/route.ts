export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const signupSchema = z.object({
  preferredRoles: z.array(z.string()).min(1).max(3),
  note: z.string().max(500).optional(),
})

async function getEvent(id: string) {
  return prisma.event.findUnique({ where: { id } })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await getEvent(params.id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (event.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Event is not open for signups' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.message }, { status: 400 })
  }

  const existing = await prisma.signup.findUnique({
    where: { eventId_userId: { eventId: params.id, userId: session.user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Already signed up. Use PUT to update.' }, { status: 409 })
  }

  const signup = await prisma.signup.create({
    data: {
      eventId: params.id,
      userId: session.user.id,
      preferredRoles: parsed.data.preferredRoles,
      note: parsed.data.note,
      status: 'ACTIVE',
    },
    include: { user: { select: { id: true, discordName: true, avatarUrl: true } } },
  })

  return NextResponse.json(signup, { status: 201 })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await getEvent(params.id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (event.status === 'LOCKED' || event.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Event is locked. No changes allowed.' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.message }, { status: 400 })
  }

  const signup = await prisma.signup.upsert({
    where: { eventId_userId: { eventId: params.id, userId: session.user.id } },
    update: {
      preferredRoles: parsed.data.preferredRoles,
      note: parsed.data.note,
      status: 'ACTIVE',
    },
    create: {
      eventId: params.id,
      userId: session.user.id,
      preferredRoles: parsed.data.preferredRoles,
      note: parsed.data.note,
      status: 'ACTIVE',
    },
    include: { user: { select: { id: true, discordName: true, avatarUrl: true } } },
  })

  return NextResponse.json(signup)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await getEvent(params.id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (event.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Event is completed.' }, { status: 400 })
  }

  await prisma.signup.updateMany({
    where: { eventId: params.id, userId: session.user.id },
    data: { status: 'WITHDRAWN' },
  })

  return NextResponse.json({ ok: true })
}
