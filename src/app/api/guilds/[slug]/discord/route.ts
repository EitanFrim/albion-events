export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

interface RouteParams { params: { slug: string } }

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, guild.id, 'OWNER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.guild.update({
    where: { id: guild.id },
    data: {
      discordGuildId: null,
      discordMemberRoleId: null,
      discordBotInstalled: false,
    },
  })

  return NextResponse.json({ success: true })
}
