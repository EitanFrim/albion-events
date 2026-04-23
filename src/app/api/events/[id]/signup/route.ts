export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUser } from '@/lib/token-auth'
import { upsertSignup } from '@/lib/signup'
import { z } from 'zod'

const signupSchema = z.object({
  preferredRoles: z.array(z.string()).min(1).max(3),
  note: z.string().max(500).optional(),
})

async function getEvent(id: string) {
  return prisma.event.findUnique({ where: { id } })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // upsertFromToken=true so first-touch token signups can create the User row
  const user = await resolveUser(req, params.id, { upsertFromToken: true })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const result = await upsertSignup({
    userId: user.id,
    eventId: params.id,
    preferredRoles: parsed.data.preferredRoles,
    note: parsed.data.note,
    rejectIfActive: true,
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

  return NextResponse.json(result.signup, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await resolveUser(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await getEvent(params.id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (event.status === 'LOCKED' || event.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Event is locked. No changes allowed.' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const result = await upsertSignup({
    userId: user.id,
    eventId: params.id,
    preferredRoles: parsed.data.preferredRoles,
    note: parsed.data.note,
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

  return NextResponse.json(result.signup)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await resolveUser(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await getEvent(params.id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (event.status === 'COMPLETED') return NextResponse.json({ error: 'Event is completed.' }, { status: 400 })

  await prisma.signup.updateMany({
    where: { eventId: params.id, userId: user.id },
    data: { status: 'WITHDRAWN' },
  })

  return NextResponse.json({ ok: true })
}
