import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No session' })

  const userId = session.user.id
  const dbUser = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null
  const memberships = userId ? await prisma.guildMembership.findMany({
    where: { userId },
    include: { guild: { select: { name: true, slug: true } } },
  }) : []

  return NextResponse.json({
    sessionUserId: userId,
    sessionRole: session.user.role,
    dbUser: dbUser ? { id: dbUser.id, discordName: dbUser.discordName, role: dbUser.role } : null,
    memberships: memberships.map(m => ({
      guild: m.guild.name,
      slug: m.guild.slug,
      role: m.role,
      status: m.status,
    })),
  })
}
