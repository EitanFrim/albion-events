export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { setUserIgn } from '@/lib/ign'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code, inGameName } = await req.json()
  if (!code) return NextResponse.json({ error: 'Invite code required' }, { status: 400 })
  if (!inGameName || typeof inGameName !== 'string' || !inGameName.trim()) {
    return NextResponse.json({ error: 'In-game name is required' }, { status: 400 })
  }

  const guild = await prisma.guild.findUnique({
    where: { inviteCode: code.toUpperCase().trim() },
  })

  if (!guild) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

  // Already a member?
  const existing = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })

  if (existing) {
    // If suspended (removed), reactivate as pending so they can rejoin — balance is preserved
    if (existing.status === 'SUSPENDED') {
      const updated = await prisma.guildMembership.update({
        where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
        data: { status: 'PENDING' },
      })
      return NextResponse.json({ guild, membership: updated }, { status: 201 })
    }
    return NextResponse.json({ guild, membership: existing, alreadyMember: true })
  }

  // Verify and save IGN — runs Albion lookup + side effects (link energy, apply balance imports)
  const ignResult = await setUserIgn(session.user.id, inGameName, { region: guild.serverRegion })
  if (!ignResult.ok) {
    return NextResponse.json({ error: ignResult.error }, { status: ignResult.status })
  }

  // Create pending membership — officer must verify
  const membership = await prisma.guildMembership.create({
    data: {
      userId: session.user.id,
      guildId: guild.id,
      role: 'PLAYER',
      status: 'PENDING',
    },
  })

  return NextResponse.json({ guild, membership }, { status: 201 })
}
