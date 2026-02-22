'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function NavBar() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [inGameName, setInGameName] = useState<string | null>(null)
  const [nameLoaded, setNameLoaded] = useState(false)
  const pathname = usePathname()

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
      <nav className="sticky top-0 z-50 h-14 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-display text-sm font-700 text-text-primary tracking-tight hidden sm:block">
              Albion Events
            </span>
          </Link>

          {/* Nav */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-body transition-colors ${
                pathname === '/' ? 'text-text-primary bg-bg-elevated' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              Events
            </Link>
            {session?.user.role === 'ADMIN' && (
              <Link
                href="/admin/events/new"
                className="px-3 py-1.5 rounded-lg text-sm font-body text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                + New Content
              </Link>
            )}
            {session?.user.role === 'ADMIN' && (
              <Link href="/admin/roles"
                className={`px-3 py-1.5 rounded-lg text-sm font-body transition-colors ${pathname === '/admin/roles' ? 'text-text-primary bg-bg-elevated' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'}`}>
                Roles
              </Link>
            )}
            {session?.user.role === 'ADMIN' && (
              <Link href="/admin/templates"
                className={`px-3 py-1.5 rounded-lg text-sm font-body transition-colors ${pathname === '/admin/templates' ? 'text-text-primary bg-bg-elevated' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'}`}>
                Templates
              </Link>
            )}
            {(session?.user.role === 'ADMIN') && (
              <Link href="/admin/players"
                className={`px-3 py-1.5 rounded-lg text-sm font-body transition-colors ${pathname === '/admin/players' ? 'text-text-primary bg-bg-elevated' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'}`}>
                Players
              </Link>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {status === 'loading' ? (
              <div className="w-7 h-7 rounded-full bg-bg-elevated animate-pulse" />
            ) : session ? (
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
                      {(inGameName || session.user.discordName)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-medium text-text-primary leading-tight">
                      {inGameName ?? session.user.discordName}
                    </div>
                  </div>
                  {session.user.role === 'ADMIN' && (
                    <span className="hidden sm:block text-xs font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/20">
                      Admin
                    </span>
                  )}
                  <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full w-52 pt-1">
                  <div className="card-elevated border border-border py-1 shadow-card-hover animate-fade-in">
                    <div className="px-3 py-2.5 border-b border-border-subtle">
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
                      className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {inGameName ? 'Edit Profile' : 'Set In-Game Name'}
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => signIn('discord')} className="btn-primary text-xs py-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                Login with Discord
              </button>
            )}
          </div>
        </div>
      </nav>

      {showNameWarning && (
        <div className="bg-amber-950/50 border-b border-amber-900/40 px-4 py-2 flex items-center justify-between gap-4">
          <p className="text-amber-400/80 text-xs">
            Set your in-game name so the guild leader can identify you on the roster.
          </p>
          <Link href="/profile" className="text-xs font-medium text-amber-400 hover:text-amber-300 flex-shrink-0 flex items-center gap-1">
            Set name →
          </Link>
        </div>
      )}
    </>
  )
}
