export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { z } from 'zod'

const schema = z.object({ userId: z.string(), roleSlotId: z.string() })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, event.guildId, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const { userId, roleSlotId } = parsed.data

  // Verify user is an active guild member
  const membership = await prisma.guildMembership.findFirst({
    where: { userId, guildId: event.guildId, status: 'ACTIVE' },
  })
  if (!membership) return NextResponse.json({ error: 'Player is not an active guild member' }, { status: 400 })

  const slot = await prisma.roleSlot.findUnique({ where: { id: roleSlotId } })
  if (!slot) return NextResponse.json({ error: 'Role slot not found' }, { status: 404 })

  const currentCount = await prisma.assignment.count({ where: { roleSlotId } })
  if (currentCount >= slot.capacity) return NextResponse.json({ error: 'Slot is full' }, { status: 400 })

  // Create or reactivate signup
  const signup = await prisma.signup.upsert({
    where: { eventId_userId: { eventId: params.id, userId } },
    update: { status: 'ACTIVE', preferredRoles: [slot.roleName] },
    create: {
      eventId: params.id, userId,
      preferredRoles: [slot.roleName], status: 'ACTIVE',
    },
  })

  // Remove any existing assignment, then create new one
  await prisma.assignment.deleteMany({ where: { eventId: params.id, userId } })

  const assignment = await prisma.assignment.create({
    data: {
      eventId: params.id, userId, roleSlotId,
      signupId: signup.id, assignedById: session.user.id,
    },
    include: {
      user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      roleSlot: true,
    },
  })

  return NextResponse.json(assignment, { status: 201 })
}
