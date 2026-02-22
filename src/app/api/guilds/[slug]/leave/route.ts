import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (guild.ownerId === session.user.id) {
    return NextResponse.json({ error: 'Guild owner cannot leave. Transfer ownership or delete the guild.' }, { status: 400 })
  }

  await prisma.guildMembership.deleteMany({
    where: { userId: session.user.id, guildId: guild.id },
  })

  return NextResponse.json({ ok: true })
}
