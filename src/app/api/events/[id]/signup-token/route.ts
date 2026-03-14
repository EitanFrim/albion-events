export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tokenSignupSchema = z.object({
  token: z.string().min(1),
  preferredRoles: z.array(z.string()).min(1).max(3),
  note: z.string().max(500).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = tokenSignupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { token, preferredRoles, note } = parsed.data

  // Find and validate token atomically
  const signupToken = await prisma.eventSignupToken.findUnique({
    where: { token },
  })

  if (!signupToken) {
    return NextResponse.json({ error: 'Invalid signup link.' }, { status: 400 })
  }

  if (signupToken.eventId !== params.id) {
    return NextResponse.json({ error: 'Invalid signup link.' }, { status: 400 })
  }

  if (signupToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This signup link has expired. Click the Sign Up button in Discord to get a new one.' }, { status: 400 })
  }

  if (signupToken.usedAt) {
    return NextResponse.json({ error: 'This signup link has already been used.' }, { status: 400 })
  }

  // Validate event
  const event = await prisma.event.findUnique({
    where: { id: params.id },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  }

  if (event.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Event is not open for signups.' }, { status: 400 })
  }

  // Find or create user by Discord ID
  const user = await prisma.user.upsert({
    where: { discordUserId: signupToken.discordUserId },
    create: {
      discordUserId: signupToken.discordUserId,
      discordName: signupToken.discordUsername,
    },
    update: {},
  })

  // Ensure guild membership exists (as GUEST for public events)
  if (event.visibility === 'MEMBERS_ONLY') {
    const membership = await prisma.guildMembership.findUnique({
      where: { userId_guildId: { userId: user.id, guildId: event.guildId } },
    })
    if (!membership || membership.status !== 'ACTIVE' || membership.role === 'GUEST') {
      return NextResponse.json({ error: 'This event is for guild members only. Register as a member first.' }, { status: 403 })
    }
  } else {
    // Public event — ensure at least GUEST membership
    await prisma.guildMembership.upsert({
      where: { userId_guildId: { userId: user.id, guildId: event.guildId } },
      create: { userId: user.id, guildId: event.guildId, role: 'GUEST', status: 'ACTIVE' },
      update: {},
    })
  }

  // Create or update signup
  const signup = await prisma.signup.upsert({
    where: { eventId_userId: { eventId: params.id, userId: user.id } },
    update: { preferredRoles, note: note ?? null, status: 'ACTIVE' },
    create: {
      eventId: params.id,
      userId: user.id,
      preferredRoles,
      note: note ?? null,
      status: 'ACTIVE',
    },
  })

  // Mark token as used (atomic — prevents race conditions)
  const updated = await prisma.eventSignupToken.updateMany({
    where: { id: signupToken.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  if (updated.count === 0) {
    // Token was used by concurrent request — signup still went through via upsert, so that's fine
  }

  return NextResponse.json({ ok: true, signupId: signup.id }, { status: 201 })
}
