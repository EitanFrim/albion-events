import Link from 'next/link'
import Image from 'next/image'
import { patchNotes } from '@/lib/patch-notes'

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Events & Signups',
    desc: 'Create ZvZ, ganking, HG events. Members sign up with preferred roles. Officers lock and assign compositions.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Comp Builder',
    desc: 'Build reusable compositions with custom roles, color-coded categories, and pre-defined build setups per weapon.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Loot Splits',
    desc: 'Fair loot tab sales with draw system. Track silver balances, regear deductions, and full payout history.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Siphoned Energy',
    desc: 'Import energy logs from the game. Track debts per member. Auto-DM players who owe energy via Discord.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Guild Dashboard',
    desc: 'Member roster, weekly attendance leaderboard, activity feed, and upcoming events — all on one homepage.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
      </svg>
    ),
    title: 'Discord Bot',
    desc: 'Event announcements, loot draws, balance checks, and DM notifications — all from your Discord server.',
  },
]

const steps = [
  { num: '1', title: 'Sign in with Discord', desc: 'One click. No forms, no passwords, no downloads.' },
  { num: '2', title: 'Create or join a guild', desc: 'Link your Discord server. Officers sync automatically.' },
  { num: '3', title: 'Start managing', desc: 'Plan events, build comps, split loot, track energy.' },
]

export default function HomePage() {
  const latestPatch = patchNotes[0]

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/images/backgrounds/hero-bg.png"
            alt=""
            fill
            className="object-cover opacity-[0.08]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-base/60 to-bg-base" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-accent-glow/30 to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 pt-24 pb-20 text-center relative animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-8 animate-scale-in overflow-hidden shadow-glow-sm">
            <Image src="/images/branding/logo.png" alt="AlbionHQ" width={56} height={56} className="object-contain" />
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-800 text-text-primary tracking-tight mb-4">
            AlbionHQ
          </h1>
          <p className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The free guild management suite for Albion Online. Events, comps, loot splits, siphoned energy, Discord bot — everything your guild needs in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/guilds"
              className="btn-primary px-8 py-3 text-base font-semibold rounded-lg shadow-glow-sm hover:shadow-glow-orange transition-all duration-300"
            >
              Get Started — Free
            </Link>
            <Link
              href="/crafting"
              className="btn-secondary px-8 py-3 text-base font-semibold rounded-lg transition-all duration-300"
            >
              Crafting Calculator
            </Link>
          </div>

          <p className="text-text-muted text-xs mt-4">No downloads. No fees. Sign in with Discord and go.</p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-700 text-text-primary mb-3">
            Everything your guild needs
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            Built by an Albion player for guild leaders who are tired of spreadsheets and manual tracking.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-bg-surface p-6 transition-all duration-300 hover:border-border-strong hover:bg-bg-elevated cursor-default"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                {f.icon}
              </div>
              <h3 className="font-display text-base font-600 text-text-primary mb-2">{f.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="rounded-xl border border-border bg-bg-surface p-8 sm:p-10">
          <h2 className="font-display text-2xl font-700 text-text-primary mb-8 text-center">
            Up and running in 2 minutes
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                  <span className="font-display text-lg font-700 text-accent">{step.num}</span>
                </div>
                <h3 className="text-text-primary font-semibold mb-2">{step.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-6 stagger-children">
          {/* Guild Management Card */}
          <Link
            href="/guilds"
            className="group block rounded-xl border border-border bg-bg-surface overflow-hidden shadow-card transition-all duration-300 ease-out-expo hover:shadow-card-hover hover:border-border-strong cursor-pointer"
          >
            <div className="relative h-40 overflow-hidden">
              <Image
                src="/images/cards/guild-management.png"
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/60 to-transparent" />
            </div>
            <div className="p-6 -mt-8 relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-700 text-text-primary group-hover:text-accent transition-colors duration-300">
                  Guild Management
                </h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                Full guild event planner with compositions, signups, role assignments, loot distribution, and Discord integration.
              </p>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" opacity={0.6}>
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                Sign in with Discord
              </div>
            </div>
          </Link>

          {/* Crafting Calculator Card */}
          <Link
            href="/crafting"
            className="group block rounded-xl border border-border bg-bg-surface overflow-hidden shadow-card transition-all duration-300 ease-out-expo hover:shadow-card-hover hover:border-border-strong cursor-pointer"
          >
            <div className="relative h-40 overflow-hidden">
              <Image
                src="/images/cards/crafting-calculator.png"
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/60 to-transparent" />
            </div>
            <div className="p-6 -mt-8 relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-700 text-text-primary group-hover:text-gold transition-colors duration-300">
                  Crafting Calculator
                </h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                Real-time refining and transmutation profit calculator with live market prices from all cities.
              </p>
              <div className="text-xs text-text-muted">
                No login required
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Latest Update Banner */}
      {latestPatch && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <Link
            href="/patch-notes"
            className="group block rounded-xl border border-border bg-bg-surface p-6 sm:p-8 transition-all duration-300 hover:border-border-strong cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/20">
                    v{latestPatch.version}
                  </span>
                  <span className="text-xs text-text-muted">{latestPatch.date}</span>
                </div>
                <h3 className="font-display text-lg font-600 text-text-primary mb-2 group-hover:text-accent transition-colors">
                  {latestPatch.title}
                </h3>
                <ul className="space-y-1">
                  {latestPatch.changes.slice(0, 4).map((c, i) => (
                    <li key={i} className="text-text-secondary text-sm flex items-start gap-2">
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        c.type === 'added' ? 'bg-green-400' : c.type === 'fixed' ? 'bg-blue-400' : 'bg-amber-400'
                      }`} />
                      {c.text}
                    </li>
                  ))}
                  {latestPatch.changes.length > 4 && (
                    <li className="text-text-muted text-sm pl-3.5">
                      +{latestPatch.changes.length - 4} more changes
                    </li>
                  )}
                </ul>
              </div>
              <svg className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </section>
      )}

      {/* Footer CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="text-center">
          <h2 className="font-display text-2xl font-700 text-text-primary mb-3">
            Ready to level up your guild?
          </h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            Join guilds already using AlbionHQ to run smoother events, fairer loot, and happier members.
          </p>
          <Link
            href="/guilds"
            className="btn-primary px-8 py-3 text-base font-semibold rounded-lg shadow-glow-sm hover:shadow-glow-orange transition-all duration-300"
          >
            Get Started — Free
          </Link>
          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-text-muted">
            <Link href="/patch-notes" className="hover:text-accent transition-colors">Patch Notes</Link>
            <span className="w-1 h-1 rounded-full bg-text-muted/30" />
            <Link href="/crafting" className="hover:text-accent transition-colors">Crafting Calculator</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
