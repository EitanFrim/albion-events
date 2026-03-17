export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { importBalances } from '@/lib/balance-import'
import { z } from 'zod'

const entrySchema = z.object({
  playerName: z.string().min(1).max(64),
  amount: z.number().int(),
})

const importSchema = z.object({
  entries: z.array(entrySchema).min(1).max(5000),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = importSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', details: parsed.error.message }, { status: 400 })

  const result = await importBalances(guild.id, session.user.id, parsed.data.entries)

  return NextResponse.json(result)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const pending = await prisma.pendingBalanceImport.findMany({
    where: { guildId: guild.id, appliedAt: null },
    orderBy: { playerName: 'asc' },
    select: { id: true, playerName: true, amount: true, createdAt: true },
  })

  return NextResponse.json({ pending })
}
