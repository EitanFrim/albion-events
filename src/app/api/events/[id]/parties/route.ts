export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { z } from 'zod'

const roleSlotSchema = z.object({
  roleName: z.string().min(1),
  capacity: z.number().int().min(1).default(1),
  tags: z.array(z.string()).default([]),
  minIp: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const partySchema = z.object({
  name: z.string().min(1),
  roleSlots: z.array(roleSlotSchema).default([]),
})

async function getEventAndCheckAccess(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { parties: true } })
  if (!event) return { event: null, access: null }
  const access = await requireGuildAccess(userId, event.guildId, 'OFFICER')
  return { event, access }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event, access } = await getEventAndCheckAccess(params.id, session.user.id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (event.status === 'COMPLETED') return NextResponse.json({ error: 'Cannot modify a completed event' }, { status: 400 })

  const body = await req.json()
  const parsed = partySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const party = await prisma.party.create({
    data: {
      eventId: params.id,
      name: parsed.data.name,
      displayOrder: event.parties.length,
      roleSlots: {
        create: parsed.data.roleSlots.map((slot, i) => ({ ...slot, displayOrder: i })),
      },
    },
    include: { roleSlots: true },
  })

  return NextResponse.json(party, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event, access } = await getEventAndCheckAccess(params.id, session.user.id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { partyId, name, roleSlots } = await req.json()
  const party = await prisma.party.findFirst({ where: { id: partyId, eventId: params.id } })
  if (!party) return NextResponse.json({ error: 'Party not found' }, { status: 404 })

  await prisma.roleSlot.deleteMany({ where: { partyId } })
  const updatedParty = await prisma.party.update({
    where: { id: partyId },
    data: {
      ...(name ? { name } : {}),
      roleSlots: {
        create: roleSlots.map((slot: any, i: number) => ({
          roleName: slot.roleName, capacity: slot.capacity ?? 1,
          tags: slot.tags ?? [], minIp: slot.minIp ?? null,
          notes: slot.notes ?? null, displayOrder: i,
        })),
      },
    },
    include: { roleSlots: true },
  })

  return NextResponse.json(updatedParty)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event, access } = await getEventAndCheckAccess(params.id, session.user.id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { partyId } = await req.json()
  await prisma.party.delete({ where: { id: partyId, eventId: params.id } })
  return NextResponse.json({ ok: true })
}
