export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { z } from 'zod'

const createEventSchema = z.object({
  guildSlug: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  timezone: z.string().default('UTC'),
  locationNote: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createEventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const { guildSlug, title, description, startTime, timezone, locationNote, status } = parsed.data

  const guild = await prisma.guild.findUnique({ where: { slug: guildSlug } })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const event = await prisma.event.create({
    data: {
      guildId: guild.id,
      title, description, startTime: new Date(startTime),
      timezone, locationNote, status,
      createdById: session.user.id,
    },
    include: {
      parties: { include: { roleSlots: true } },
      createdBy: { select: { discordName: true, avatarUrl: true } },
    },
  })

  return NextResponse.json(event, { status: 201 })
}
