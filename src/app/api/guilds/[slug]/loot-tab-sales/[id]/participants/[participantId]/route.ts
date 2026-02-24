export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

// DELETE — Remove a participant
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string; participantId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const myAccess = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!myAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify the sale belongs to this guild and isn't split yet
  const sale = await prisma.lootTabSale.findFirst({
    where: { id: params.id, guildId: guild.id },
  })
  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })

  if (sale.splitCompleted) {
    return NextResponse.json({ error: 'Cannot remove participants after split' }, { status: 400 })
  }

  // Delete the participant
  const participant = await prisma.lootTabParticipant.findFirst({
    where: { id: params.participantId, saleId: sale.id },
  })

  if (!participant) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
  }

  await prisma.lootTabParticipant.delete({
    where: { id: params.participantId },
  })

  return NextResponse.json({ ok: true })
}
