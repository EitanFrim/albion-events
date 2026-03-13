export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      usersThisWeek,
      usersThisMonth,
      usersToday,
      totalGuilds,
      guildsThisWeek,
      totalEvents,
      eventsThisWeek,
      totalSignups,
      totalMemberships,
      activeMemberships,
      topGuilds,
      recentUsers,
      eventsByStatus,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.guild.count(),
      prisma.guild.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.event.count(),
      prisma.event.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.signup.count(),
      prisma.guildMembership.count(),
      prisma.guildMembership.count({ where: { status: 'ACTIVE' } }),
      prisma.guild.findMany({
        include: {
          _count: { select: { members: true, events: true } },
        },
        orderBy: { members: { _count: 'desc' } },
        take: 10,
      }),
      prisma.user.findMany({
        include: {
          _count: { select: { memberships: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      prisma.event.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        today: usersToday,
        thisWeek: usersThisWeek,
        thisMonth: usersThisMonth,
      },
      guilds: {
        total: totalGuilds,
        thisWeek: guildsThisWeek,
      },
      events: {
        total: totalEvents,
        thisWeek: eventsThisWeek,
        byStatus: eventsByStatus.reduce(
          (acc, e) => ({ ...acc, [e.status]: e._count._all }),
          {} as Record<string, number>,
        ),
      },
      signups: { total: totalSignups },
      memberships: { total: totalMemberships, active: activeMemberships },
      topGuilds,
      recentUsers,
    });
  } catch (error) {
    console.error('[admin/stats] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
