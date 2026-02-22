import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  const guild = await prisma.guild.findUnique({
    where: { slug: params.slug },
    include: {
      owner: { select: { id: true, discordName: true, inGameName: true } },
      _count: { select: { members: true, events: true } },
    },
  })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const membership = session?.user?.id ? await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  }) : null

  return NextResponse.json({ ...guild, membership })
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (guild.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Only the guild owner can edit it' }, { status: 403 })
  }

  const body = await req.json()
  const name = body.name?.trim()
  const logoUrl = body.logoUrl !== undefined ? (body.logoUrl?.trim() || null) : undefined

  if (name !== undefined && (name.length < 2 || name.length > 64)) {
    return NextResponse.json({ error: 'Name must be 2–64 characters' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (logoUrl !== undefined) data.logoUrl = logoUrl

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const updated = await prisma.guild.update({
    where: { slug: params.slug },
    data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (guild.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Only the guild owner can delete it' }, { status: 403 })
  }

  await prisma.guild.delete({ where: { slug: params.slug } })
  return NextResponse.json({ ok: true })
}
