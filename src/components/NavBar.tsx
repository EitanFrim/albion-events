'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { dropdown, transitions } from '@/lib/animations'

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`relative px-3 py-1.5 rounded-full text-sm font-body font-medium transition-colors duration-200 ${
        active
          ? 'text-text-primary bg-accent/10'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute inset-0 rounded-full bg-accent/10 -z-10"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Top glow line */}
          <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-accent rounded-full">
            <div className="absolute w-12 h-4 bg-accent/20 rounded-full blur-md -top-1 -left-2" />
          </div>
        </motion.div>
      )}
    </Link>
  )
}

export function NavBar() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [inGameName, setInGameName] = useState<string | null>(null)
  const [nameLoaded, setNameLoaded] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()

  useEffect(() => {
    if (!session?.user?.id) return
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => { setInGameName(d.inGameName ?? null); setNameLoaded(true) })
      .catch(() => setNameLoaded(true))
  }, [session?.user?.id])

  const showNameWarning = nameLoaded && session && !inGameName

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0, x: '-50%' }}
        animate={{ y: 0, opacity: 1, x: '-50%' }}
        transition={{ ...transitions.smooth, delay: 0.1 }}
        className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl"
      >
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          style={{ background: 'rgba(15, 15, 35, 0.7)' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group" title="AlbionHQ Home">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-accent/40 group-hover:shadow-glow-sm">
                <Image src="/images/branding/logo.png" alt="AlbionHQ" width={22} height={22} className="object-contain" />
              </div>
              <span className="font-display text-sm text-text-primary tracking-wider hidden sm:block">
                ALBIONHQ
              </span>
            </Link>
          </div>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-1">
            {session && (
              <NavLink href="/guilds" active={pathname === '/guilds'}>
                My Guilds
              </NavLink>
            )}
            <NavLink href="/crafting" active={pathname.startsWith('/crafting')}>
              Crafting
            </NavLink>
            <NavLink href="/patch-notes" active={pathname === '/patch-notes'}>
              Updates
            </NavLink>
            {session?.user?.role === 'ADMIN' && (
              <NavLink href="/admin/stats" active={pathname === '/admin/stats'}>
                Stats
              </NavLink>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => startRefresh(() => router.refresh())}
              disabled={isRefreshing}
              title="Refresh data"
              className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer disabled:opacity-50"
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

            {status === 'loading' ? (
              <div className="w-7 h-7 rounded-full bg-bg-elevated animate-pulse" />
            ) : session ? (
              <div className="relative" onMouseLeave={() => setMenuOpen(false)}>
                <button
                  onMouseEnter={() => setMenuOpen(true)}
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  {session.user.image ? (
                    <Image src={session.user.image} alt="" width={26} height={26} className="rounded-full ring-1 ring-accent/20" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-mono text-accent">
                      {(inGameName || session.user.discordName)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-medium text-text-primary leading-tight">
                      {inGameName ?? session.user.discordName}
                    </div>
                  </div>
                  {session.user.role === 'ADMIN' && (
                    <span className="hidden sm:block text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                      Admin
                    </span>
                  )}
                  <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    variants={dropdown}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 top-full w-52 pt-2"
                  >
                  <div className="rounded-xl border border-white/[0.08] py-1 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)]" style={{ background: 'rgba(15, 15, 35, 0.9)' }}>
                    <div className="px-3 py-2.5 border-b border-white/[0.04]">
                      {inGameName ? (
                        <>
                          <p className="text-sm font-medium text-text-primary">{inGameName}</p>
                          <p className="text-xs text-text-muted mt-0.5 truncate">{session.user.discordName}</p>
                        </>
                      ) : (
                        <p className="text-sm text-text-secondary truncate">{session.user.discordName}</p>
                      )}
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-accent/5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {inGameName ? 'Edit Profile' : 'Set In-Game Name'}
                    </Link>
                    {session.user.role === 'ADMIN' && (
                      <Link
                        href="/admin/stats"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-accent/70 hover:text-accent hover:bg-accent/5 transition-colors md:hidden"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Stats
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-accent/5 transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                onClick={() => signIn('discord')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-neon text-xs py-2 px-4 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                Login
              </motion.button>
            )}
          </div>
        </div>
      </motion.nav>

      {showNameWarning && (
        <div className="fixed top-[76px] left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-5xl">
          <div className="bg-amber-950/60 backdrop-blur-xl border border-amber-900/40 rounded-xl px-4 py-2 flex items-center justify-between gap-4">
            <p className="text-amber-400/80 text-xs">
              Set your in-game name so the guild leader can identify you.
            </p>
            <Link href="/profile" className="text-xs font-medium text-amber-400 hover:text-amber-300 flex-shrink-0 flex items-center gap-1 cursor-pointer">
              Set name
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
