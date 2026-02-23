export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyAlbionName } from '@/lib/albion'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, guildSlug } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  // If no guild slug provided, skip verification
  if (!guildSlug) {
    return NextResponse.json({ valid: true, exactName: name.trim() })
  }

  const guild = await prisma.guild.findUnique({
    where: { slug: guildSlug },
    select: { serverRegion: true },
  })

  // If guild not found or no region configured, skip verification
  if (!guild?.serverRegion) {
    return NextResponse.json({ valid: true, exactName: name.trim() })
  }

  const result = await verifyAlbionName(name.trim(), guild.serverRegion)
  return NextResponse.json(result)
}
