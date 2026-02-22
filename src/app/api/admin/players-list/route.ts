export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const guildSlug = request.nextUrl.searchParams.get('guildSlug');

    let players;

    if (guildSlug) {
      const guild = await prisma.guild.findUnique({ where: { slug: guildSlug } });
      if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 });

      players = await prisma.user.findMany({
        where: {
          memberships: { some: { guildId: guild.id } },
        },
        select: {
          id: true,
          discordName: true,
          inGameName: true,
          avatarUrl: true,
        },
        orderBy: { discordName: 'asc' },
      });
    } else {
      if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      players = await prisma.user.findMany({
        select: {
          id: true,
          discordName: true,
          inGameName: true,
          avatarUrl: true,
        },
        orderBy: { discordName: 'asc' },
      });
    }

    return NextResponse.json({ players }, { status: 200 });
  } catch (error) {
    console.error('[players-list] Error fetching players:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}
