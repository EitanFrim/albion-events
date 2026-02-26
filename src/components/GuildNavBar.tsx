'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface Props {
  guild: { id: string; name: string; slug: string; logoUrl?: string | null }
  membership: { role: string; status: string; balance: number }
  totalGuildBalance?: number
}

const roleColors: Record<string, string> = {
  OWNER: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  OFFICER: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  PLAYER: 'text-text-muted bg-bg-elevated border-border',
  ALLIANCE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  OFFICER: 'Officer',
  PLAYER: 'Member',
  ALLIANCE: 'Alliance',
}

export function GuildNavBar({ guild, membership, totalGuildBalance = 0 }: Props) {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mgmtOpen, setMgmtOpen] = useState(false)
  const mgmtRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const base = `/g/${guild.slug}`

  const isOfficerPlus = membership.role === 'OWNER' || membership.role === 'OFFICER'
  const isOwner = membership.role === 'OWNER'
  const isPending = membership.status === 'PENDING'

  // Close management dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mgmtRef.current && !mgmtRef.current.contains(e.target as Node)) {
        setMgmtOpen(false)
      }
    }
    if (mgmtOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mgmtOpen])

  // Close management dropdown on route change
  useEffect(() => { setMgmtOpen(false) }, [pathname])

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

  const mgmtActive = pathname.startsWith(`${base}/admin/players`) ||
    pathname.startsWith(`${base}/admin/balance-logs`) ||
    pathname.startsWith(`${base}/admin/loot-split`) ||
    pathname.startsWith(`${base}/admin/loot-tab-sales`) ||
    pathname.startsWith(`${base}/settings`)

  const mgmtLinks = [
    { href: `${base}/admin/players`, label: 'Players', icon: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z', show: true },
    { href: `${base}/admin/balance-logs`, label: 'Balance Logs', icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z', show: true },
    { href: `${base}/admin/loot-split`, label: 'Loot Split', icon: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', show: true },
    { href: `${base}/admin/loot-tab-sales`, label: 'Loot Tab Sales', icon: 'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z', show: true },
    { href: `${base}/settings`, label: 'Settings', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z', show: isOwner },
  ]

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

              {/* Management dropdown */}
              {isOfficerPlus && (
                <div ref={mgmtRef} className="relative">
                  <button
                    onClick={() => setMgmtOpen(!mgmtOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body transition-colors ${
                      mgmtActive || mgmtOpen
                        ? 'text-text-primary bg-bg-elevated'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                    </svg>
                    Management
                    <svg className={`w-3 h-3 text-text-muted transition-transform ${mgmtOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {mgmtOpen && (
                    <div className="absolute left-0 top-full pt-1.5 z-50">
                      <div className="w-64 rounded-xl bg-bg-surface border border-border shadow-[0_16px_48px_rgba(0,0,0,0.4)] animate-fade-in overflow-hidden">
                        {/* Total guild silver */}
                        <div className="px-4 py-3 border-b border-border-subtle bg-gradient-to-r from-amber-500/[0.06] to-transparent">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-0.5">Guild Total Silver</p>
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="https://render.albiononline.com/v1/item/T8_SILVERBAG_NONTRADABLE" alt="Silver" className="w-5 h-5 flex-shrink-0" />
                            <span className={`text-lg font-display font-700 ${totalGuildBalance < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                              {totalGuildBalance.toLocaleString()}
                            </span>
                            <span className="text-xs text-text-muted">silver</span>
                          </div>
                        </div>

                        {/* Links */}
                        <div className="py-1.5">
                          {mgmtLinks.filter(l => l.show).map(link => {
                            const active = pathname.startsWith(link.href)
                            return (
                              <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                  active
                                    ? 'text-accent bg-accent/5'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                                }`}
                              >
                                <svg className={`w-4 h-4 flex-shrink-0 ${active ? 'text-accent' : 'text-text-muted'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                                </svg>
                                {link.label}
                                {active && (
                                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: refresh + balance + user menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => startRefresh(() => router.refresh())}
            disabled={isRefreshing}
            title="Refresh data"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Silver balance — clickable to view history */}
          {!isPending && (
            <Link href={`${base}/my-balance`} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/5 border border-amber-500/15 hover:bg-amber-500/10 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://render.albiononline.com/v1/item/T8_SILVERBAG_NONTRADABLE" alt="Silver" className="w-5 h-5 flex-shrink-0" />
              <span className={`text-sm font-mono font-medium ${membership.balance < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                {membership.balance.toLocaleString()}
              </span>
              <span className="text-xs text-text-muted hidden sm:inline">silver</span>
            </Link>
          )}
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
