export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { setUserIgn } from '@/lib/ign'

/**
 * Set IGN via event signup token (for users without a session who arrived via
 * the Discord deep link). Signup creation itself goes through
 * /api/events/[id]/signup?token=... — this endpoint is just IGN bootstrap.
 */
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

  const signupToken = await prisma.eventSignupToken.findUnique({ where: { token } })
  if (!signupToken || signupToken.eventId !== params.id) {
    return NextResponse.json({ error: 'Invalid signup link.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { discordUserId: signupToken.discordUserId },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found. Sign up first.' }, { status: 400 })
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { guild: { select: { serverRegion: true } } },
  })
  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  }

  const verifyRegion = event.guild.serverRegion ?? region ?? null

  const result = await setUserIgn(user.id, inGameName, { region: verifyRegion })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

  return NextResponse.json({ inGameName: result.inGameName })
}
