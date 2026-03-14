export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Officer access required' }, { status: 403 })

  if (!guild.discordGuildId) {
    return NextResponse.json({ error: 'Discord server not linked' }, { status: 400 })
  }

  // Fetch channels from Discord API
  const res = await fetch(`${DISCORD_API_BASE}/guilds/${guild.discordGuildId}/channels`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch Discord channels' }, { status: 502 })
  }

  const channels: Array<{ id: string; name: string; type: number; position: number; parent_id: string | null }> = await res.json()

  // Filter to text channels (type 0) and sort by position
  const textChannels = channels
    .filter(c => c.type === 0)
    .sort((a, b) => a.position - b.position)
    .map(c => ({ id: c.id, name: c.name }))

  return NextResponse.json(textChannels)
}
