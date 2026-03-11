export const dynamic = 'force-dynamic';

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
  const bannerUrl = body.bannerUrl !== undefined ? (body.bannerUrl?.trim() || null) : undefined
  const accentColor = body.accentColor !== undefined ? (body.accentColor?.trim() || null) : undefined
  const bannerPositionY = body.bannerPositionY !== undefined ? body.bannerPositionY : undefined
  const logoZoom = body.logoZoom !== undefined ? body.logoZoom : undefined
  const logoPositionX = body.logoPositionX !== undefined ? body.logoPositionX : undefined
  const logoPositionY = body.logoPositionY !== undefined ? body.logoPositionY : undefined
  const serverRegion = body.serverRegion !== undefined ? body.serverRegion : undefined

  if (name !== undefined && (name.length < 2 || name.length > 64)) {
    return NextResponse.json({ error: 'Name must be 2–64 characters' }, { status: 400 })
  }

  if (accentColor !== null && accentColor !== undefined && !/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
    return NextResponse.json({ error: 'Invalid color format (use #RRGGBB)' }, { status: 400 })
  }

  const validRegions = ['americas', 'europe', 'asia', null]
  if (serverRegion !== undefined && !validRegions.includes(serverRegion)) {
    return NextResponse.json({ error: 'Invalid server region' }, { status: 400 })
  }

  if (bannerPositionY !== undefined && (typeof bannerPositionY !== 'number' || bannerPositionY < 0 || bannerPositionY > 100)) {
    return NextResponse.json({ error: 'Banner position must be 0-100' }, { status: 400 })
  }
  if (logoZoom !== undefined && (typeof logoZoom !== 'number' || logoZoom < 1 || logoZoom > 3)) {
    return NextResponse.json({ error: 'Logo zoom must be 1-3' }, { status: 400 })
  }
  if (logoPositionX !== undefined && (typeof logoPositionX !== 'number' || logoPositionX < 0 || logoPositionX > 100)) {
    return NextResponse.json({ error: 'Logo position X must be 0-100' }, { status: 400 })
  }
  if (logoPositionY !== undefined && (typeof logoPositionY !== 'number' || logoPositionY < 0 || logoPositionY > 100)) {
    return NextResponse.json({ error: 'Logo position Y must be 0-100' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (logoUrl !== undefined) data.logoUrl = logoUrl
  if (bannerUrl !== undefined) data.bannerUrl = bannerUrl
  if (accentColor !== undefined) data.accentColor = accentColor
  if (bannerPositionY !== undefined) data.bannerPositionY = Math.round(bannerPositionY)
  if (logoZoom !== undefined) data.logoZoom = logoZoom
  if (logoPositionX !== undefined) data.logoPositionX = Math.round(logoPositionX)
  if (logoPositionY !== undefined) data.logoPositionY = Math.round(logoPositionY)
  if (serverRegion !== undefined) data.serverRegion = serverRegion

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
