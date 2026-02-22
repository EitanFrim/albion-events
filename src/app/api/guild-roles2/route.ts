import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

export async function GET(req: NextRequest) {
  const guildSlug = req.nextUrl.searchParams.get('guildSlug')
  
  if (!guildSlug) {
    // Legacy: return all (for backwards compat with existing components)
    const roles = await prisma.guildRole2.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { category: true },
    })
    return NextResponse.json(roles)
  }

  const guild = await prisma.guild.findUnique({ where: { slug: guildSlug } })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  const roles = await prisma.guildRole2.findMany({
    where: { guildId: guild.id },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: { category: true },
  })
  return NextResponse.json(roles)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, categoryId, guildSlug } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!guildSlug) return NextResponse.json({ error: 'guildSlug required' }, { status: 400 })

  const guild = await prisma.guild.findUnique({ where: { slug: guildSlug } })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const role = await prisma.guildRole2.create({
      data: { name: name.trim(), categoryId: categoryId ?? null, guildId: guild.id },
      include: { category: true },
    })
    return NextResponse.json(role, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Role name already exists' }, { status: 409 })
  }
}
