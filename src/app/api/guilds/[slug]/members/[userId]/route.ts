export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']).optional(),
  role: z.enum(['OWNER', 'OFFICER', 'PLAYER']).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const myAccess = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!myAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { status, role } = parsed.data

  // Only owners can change roles
  if (role && myAccess.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only the guild owner can change roles' }, { status: 403 })
  }

  // Can't modify the owner
  const target = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: params.userId, guildId: guild.id } },
  })
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (target.role === 'OWNER' && params.userId !== session.user.id) {
    return NextResponse.json({ error: 'Cannot modify the guild owner' }, { status: 403 })
  }

  const updateData: any = {}
  if (status) {
    updateData.status = status
    if (status === 'ACTIVE') {
      updateData.verifiedById = session.user.id
      updateData.verifiedAt = new Date()
    }
  }
  if (role) updateData.role = role

  const updated = await prisma.guildMembership.update({
    where: { userId_guildId: { userId: params.userId, guildId: guild.id } },
    data: updateData,
    include: {
      user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const myAccess = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!myAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Can't remove the owner
  const target = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: params.userId, guildId: guild.id } },
  })
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (target.role === 'OWNER') {
    return NextResponse.json({ error: 'Cannot remove the guild owner' }, { status: 403 })
  }

  await prisma.guildMembership.delete({
    where: { userId_guildId: { userId: params.userId, guildId: guild.id } },
  })

  return NextResponse.json({ success: true })
}
