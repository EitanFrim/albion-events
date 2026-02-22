'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

interface Props {
  guild: { id: string; name: string; slug: string; logoUrl?: string | null }
  membership: { role: string; status: string }
}

const roleColors: Record<string, string> = {
  OWNER: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  OFFICER: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  PLAYER: 'text-text-muted bg-bg-elevated border-border',
}

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  OFFICER: 'Officer',
  PLAYER: 'Member',
}

export function GuildNavBar({ guild, membership }: Props) {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const base = `/g/${guild.slug}`

  const isOfficerPlus = membership.role === 'OWNER' || membership.role === 'OFFICER'
  const isOwner = membership.role === 'OWNER'
  const isPending = membership.status === 'PENDING'

  function navLink(href: string, label: string) {
    const active = pathname === href || (href !== base && pathname.startsWith(href))
    return (
      <Link href={href}
        className={`px-3 py-1.5 rounded-lg text-sm font-body transition-colors ${
          active ? 'text-text-primary bg-bg-elevated' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
        }`}>
        {label}
      </Link>
    )
  }

  return (
    <nav className="sticky top-0 z-50 h-14 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">

        {/* Left: guild name + nav */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {/* Guild switcher */}
          <Link href="/?switch=1" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors flex-shrink-0 group">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center overflow-hidden">
              {guild.logoUrl ? (
                <img src={guild.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              )}
            </div>
            <span className="font-display text-sm font-700 text-text-primary tracking-tight hidden sm:block truncate max-w-[120px]">
              {guild.name}
            </span>
            <svg className="w-3.5 h-3.5 text-text-muted group-hover:text-text-secondary transition-colors hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Link>

          {/* Separator */}
          <span className="text-border mx-1 hidden sm:block">|</span>

          {/* Nav links */}
          {!isPending && (
            <div className="hidden md:flex items-center gap-1">
              {navLink(base, 'Contents')}
              {isOfficerPlus && navLink(`${base}/admin/events/new`, '+ New Content')}
              {isOfficerPlus && navLink(`${base}/admin/roles`, 'Roles')}
              {navLink(`${base}/admin/templates`, 'Builds')}
              {isOfficerPlus && navLink(`${base}/admin/players`, 'Players')}
              {isOwner && navLink(`${base}/settings`, 'Settings')}
            </div>
          )}
        </div>

        {/* Right: user menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {session && (
            <div className="relative" onMouseLeave={() => setMenuOpen(false)}>
              <button
                onMouseEnter={() => setMenuOpen(true)}
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors"
              >
                {session.user.image ? (
                  <Image src={session.user.image} alt="" width={26} height={26} className="rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-mono text-accent">
                    {(session.user.inGameName || session.user.discordName)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-text-primary leading-tight">
                    {session.user.inGameName ?? session.user.discordName}
                  </div>
                </div>
                <span className={`hidden sm:block text-xs font-mono px-1.5 py-0.5 rounded border ${roleColors[membership.role]}`}>
                  {roleLabels[membership.role]}
                </span>
                <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full w-52 pt-1">
                <div className="card-elevated border border-border py-1 shadow-card-hover animate-fade-in">
                  <div className="px-3 py-2.5 border-b border-border-subtle">
                    {session.user.inGameName ? (
                      <>
                        <p className="text-sm font-medium text-text-primary">{session.user.inGameName}</p>
                        <p className="text-xs text-text-muted mt-0.5 truncate">{session.user.discordName}</p>
                      </>
                    ) : (
                      <p className="text-sm text-text-secondary truncate">{session.user.discordName}</p>
                    )}
                  </div>
                  <Link href={`/g/${guild.slug}/guide`} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    How To
                  </Link>
                  <Link href="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Edit Profile
                  </Link>
                  <Link href="/?switch=1" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Switch Guild
                  </Link>
                  {membership.role !== 'OWNER' && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Leave ${guild.name}? You'll need a new invite to rejoin.`)) return
                        const res = await fetch(`/api/guilds/${guild.slug}/leave`, { method: 'POST' })
                        if (res.ok) { window.location.href = '/' }
                        else { const d = await res.json(); alert(d.error ?? 'Failed to leave') }
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400/70 hover:text-red-400 hover:bg-bg-overlay transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Leave Guild
                    </button>
                  )}
                  <button onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pending banner */}
      {isPending && (
        <div className="bg-amber-950/50 border-b border-amber-900/40 px-4 py-2 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <p className="text-amber-400/80 text-xs flex-1">
            Your membership in <span className="font-semibold">{guild.name}</span> is awaiting verification by an Officer.
          </p>
        </div>
      )}
    </nav>
  )
}
