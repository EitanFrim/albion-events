export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guildSlug = req.nextUrl.searchParams.get('guildSlug')

  let specs
  if (guildSlug) {
    const guild = await prisma.guild.findUnique({ where: { slug: guildSlug } })
    if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
    const access = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
    if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    specs = await prisma.playerRoleSpec.findMany({
      where: { role: { guildId: guild.id } },
      include: { role: { select: { name: true } } },
    })
  } else {
    // Fallback - check platform admin
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    specs = await prisma.playerRoleSpec.findMany({ include: { role: { select: { name: true } } } })
  }

  const map: Record<string, string[]> = {}
  for (const spec of specs) {
    if (!map[spec.userId]) map[spec.userId] = []
    map[spec.userId].push(spec.role.name)
  }
  return NextResponse.json(map)
}
