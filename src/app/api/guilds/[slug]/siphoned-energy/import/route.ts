export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { importSiphonedEnergyLogs, notifyNegativeEnergyPlayers } from '@/lib/siphoned-energy'
import { z } from 'zod'

const entrySchema = z.object({
  date: z.string().min(1),
  playerName: z.string().min(1).max(64),
  reason: z.string().max(200),
  amount: z.number().int(),
})

const importSchema = z.object({
  entries: z.array(entrySchema).min(1).max(5000),
  notify: z.boolean().optional().default(false),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const myAccess = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!myAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = importSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', details: parsed.error.message }, { status: 400 })

  const result = await importSiphonedEnergyLogs(guild.id, session.user.id, parsed.data.entries)

  // Fire-and-forget: DM players who ended up with negative energy (only if checkbox enabled)
  if (parsed.data.notify) {
    notifyNegativeEnergyPlayers(guild.id, result.affectedMembershipIds).catch(() => {})
  }

  return NextResponse.json(result)
}
