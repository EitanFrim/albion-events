'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Stats {
  users: { total: number; today: number; thisWeek: number; thisMonth: number };
  guilds: { total: number; thisWeek: number };
  events: { total: number; thisWeek: number; byStatus: Record<string, number> };
  signups: { total: number };
  memberships: { total: number; active: number };
  topGuilds: Array<{
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    _count: { members: number; events: number };
  }>;
  recentUsers: Array<{
    id: string;
    discordName: string;
    inGameName: string | null;
    avatarUrl: string | null;
    createdAt: string;
    _count: { memberships: number };
  }>;
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <p className="text-xs font-mono text-text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-display font-700 mt-1 ${accent ? 'text-accent' : 'text-text-primary'}`}>
        {value.toLocaleString()}
      </p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Admin access required' : 'Failed to load');
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-bg-elevated rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-bg-elevated rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statusLabels: Record<string, string> = {
    DRAFT: 'Draft',
    PUBLISHED: 'Published',
    LOCKED: 'Locked',
    COMPLETED: 'Completed',
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'text-text-muted',
    PUBLISHED: 'text-green-400',
    LOCKED: 'text-amber-400',
    COMPLETED: 'text-blue-400',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-mono text-text-muted uppercase tracking-wide">Platform Admin</p>
        <h1 className="font-display text-2xl font-700 text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm">Real-time platform metrics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats.users.total} sub={`+${stats.users.thisWeek} this week`} accent />
        <StatCard label="Total Guilds" value={stats.guilds.total} sub={`+${stats.guilds.thisWeek} this week`} accent />
        <StatCard label="Total Events" value={stats.events.total} sub={`+${stats.events.thisWeek} this week`} />
        <StatCard label="Total Signups" value={stats.signups.total} />
      </div>

      {/* User Growth Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Users Today" value={stats.users.today} />
        <StatCard label="Users This Week" value={stats.users.thisWeek} />
        <StatCard label="Users This Month" value={stats.users.thisMonth} />
      </div>

      {/* Memberships + Events by Status */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <p className="text-xs font-mono text-text-muted uppercase tracking-wide mb-3">Memberships</p>
          <div className="flex items-baseline gap-4">
            <div>
              <p className="text-2xl font-display font-700 text-text-primary">{stats.memberships.active.toLocaleString()}</p>
              <p className="text-xs text-text-secondary">Active</p>
            </div>
            <div>
              <p className="text-2xl font-display font-700 text-text-muted">{stats.memberships.total.toLocaleString()}</p>
              <p className="text-xs text-text-secondary">Total</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <p className="text-xs font-mono text-text-muted uppercase tracking-wide mb-3">Events by Status</p>
          <div className="flex items-baseline gap-4 flex-wrap">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key}>
                <p className={`text-2xl font-display font-700 ${statusColors[key] || 'text-text-primary'}`}>
                  {(stats.events.byStatus[key] || 0).toLocaleString()}
                </p>
                <p className="text-xs text-text-secondary">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Guilds + Recent Users */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Guilds */}
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <p className="text-xs font-mono text-text-muted uppercase tracking-wide mb-4">Top Guilds by Members</p>
          <div className="space-y-3">
            {stats.topGuilds.map((guild, i) => (
              <div key={guild.id} className="flex items-center gap-3">
                <span className="text-xs font-mono text-text-muted w-5 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{guild.name}</p>
                  <p className="text-xs text-text-secondary">
                    {guild._count.members} members &middot; {guild._count.events} events &middot;{' '}
                    {formatDistanceToNow(new Date(guild.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            {stats.topGuilds.length === 0 && (
              <p className="text-sm text-text-muted">No guilds yet</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <p className="text-xs font-mono text-text-muted uppercase tracking-wide mb-4">Recent Users</p>
          <div className="space-y-3">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center text-xs text-text-muted">
                    {user.discordName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {user.discordName}
                    {user.inGameName && (
                      <span className="text-text-muted font-normal"> ({user.inGameName})</span>
                    )}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {user._count.memberships} guild{user._count.memberships !== 1 ? 's' : ''} &middot;{' '}
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentUsers.length === 0 && (
              <p className="text-sm text-text-muted">No users yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
