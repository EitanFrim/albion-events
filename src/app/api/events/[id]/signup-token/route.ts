export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyAlbionName } from '@/lib/albion'
import { linkOrphanedEnergyTransactions } from '@/lib/siphoned-energy'
import { applyPendingBalanceImports } from '@/lib/balance-import'

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

  // Find and validate token
  const signupToken = await prisma.eventSignupToken.findUnique({
    where: { token },
  })

  if (!signupToken) {
    return NextResponse.json({ error: 'Invalid signup link.' }, { status: 400 })
  }

  if (signupToken.eventId !== params.id) {
    return NextResponse.json({ error: 'Invalid signup link.' }, { status: 400 })
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

  return NextResponse.json({ ok: true, signupId: signup.id }, { status: 201 })
}

/* ─── PUT: Set IGN via token auth (for guests who haven't set their name yet) ─── */

const ignSchema = z.object({
  token: z.string().min(1),
  inGameName: z.string().min(1).max(64).trim(),
  region: z.enum(['americas', 'europe', 'asia']).optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = ignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { token, inGameName, region } = parsed.data

  // Validate token
  const signupToken = await prisma.eventSignupToken.findUnique({ where: { token } })
  if (!signupToken || signupToken.eventId !== params.id) {
    return NextResponse.json({ error: 'Invalid signup link.' }, { status: 400 })
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { discordUserId: signupToken.discordUserId },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found. Sign up first.' }, { status: 400 })
  }

  // Determine verify region from guild or request
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { guild: { select: { id: true, serverRegion: true } } },
  })
  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  }

  const verifyRegion = event.guild.serverRegion ?? region ?? null
  let finalName = inGameName

  if (verifyRegion) {
    const result = await verifyAlbionName(finalName, verifyRegion)
    if (!result.valid) {
      return NextResponse.json(
        { error: `Player "${finalName}" not found in Albion Online. Check the spelling and make sure you're on the correct server region.` },
        { status: 400 }
      )
    }
    if (result.exactName) finalName = result.exactName
  }

  // Save IGN
  await prisma.user.update({
    where: { id: user.id },
    data: { inGameName: finalName },
  })

  // Link orphaned energy transactions
  try {
    await linkOrphanedEnergyTransactions(user.id, finalName)
  } catch {
    // Non-critical
  }

  // Apply pending balance imports
  try {
    await applyPendingBalanceImports(user.id, event.guild.id).catch(() => 0)
  } catch {
    // Non-critical
  }

  return NextResponse.json({ inGameName: finalName })
}
