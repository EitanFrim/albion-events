export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

export async function GET(req: NextRequest) {
  const guildSlug = req.nextUrl.searchParams.get('guildSlug')
  if (!guildSlug) {
    const templates = await prisma.guildTemplate.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(templates)
  }
  const guild = await prisma.guild.findUnique({ where: { slug: guildSlug } })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
  const templates = await prisma.guildTemplate.findMany({ where: { guildId: guild.id }, orderBy: { name: 'asc' } })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, data, guildSlug } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!guildSlug) return NextResponse.json({ error: 'guildSlug required' }, { status: 400 })
  const guild = await prisma.guild.findUnique({ where: { slug: guildSlug } })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
  const access = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const tpl = await prisma.guildTemplate.create({ data: { name: name.trim(), data, guildId: guild.id } })
    return NextResponse.json(tpl, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Template name already exists' }, { status: 409 })
  }
}
