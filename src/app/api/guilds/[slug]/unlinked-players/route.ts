export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'OFFICER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { playerName } = await req.json()
  if (!playerName || typeof playerName !== 'string') {
    return NextResponse.json({ error: 'Player name required' }, { status: 400 })
  }

  // Delete pending balance imports for this player
  await prisma.pendingBalanceImport.deleteMany({
    where: { guildId: guild.id, playerName: { equals: playerName, mode: 'insensitive' }, appliedAt: null },
  })

  // Delete orphaned siphoned energy transactions for this player
  await prisma.siphonedEnergyTransaction.deleteMany({
    where: { guildId: guild.id, playerName: { equals: playerName, mode: 'insensitive' }, membershipId: null },
  })

  return NextResponse.json({ ok: true })
}
