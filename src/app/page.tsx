import Link from 'next/link'

export default function HomePage() {

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-glow/30 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center relative animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="font-display text-5xl font-800 text-text-primary tracking-tight mb-3">
            AlbionHQ
          </h1>
          <p className="text-text-secondary text-lg max-w-md mx-auto">
            Tools for Albion Online players and guild leaders. Manage events, track loot, calculate profits.
          </p>
        </div>
      </section>

      {/* App Cards */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-2 gap-6 stagger-children">
          {/* Guild Management Card */}
          <Link
            href="/guilds"
            className="group block rounded-xl border border-border bg-bg-surface p-6 shadow-card transition-all duration-300 ease-out-expo hover:shadow-card-hover hover:border-border-strong hover:-translate-y-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
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
              Discord login required for full access
            </div>
          </Link>

          {/* Crafting Calculator Card */}
          <Link
            href="/crafting"
            className="group block rounded-xl border border-border bg-bg-surface p-6 shadow-card transition-all duration-300 ease-out-expo hover:shadow-card-hover hover:border-border-strong hover:-translate-y-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
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
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-4 pb-20 animate-fade-in">
        <div className="rounded-xl border border-border bg-bg-surface p-8">
          <h2 className="font-display text-2xl font-700 text-text-primary mb-6">
            How Guild Management Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            <div>
              <div className="text-accent font-mono text-xs font-bold mb-2">01</div>
              <h3 className="text-text-primary font-semibold mb-1">Create Your Guild</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Link your Discord server and invite members. Officers and leaders get admin access automatically.
              </p>
            </div>
            <div>
              <div className="text-accent font-mono text-xs font-bold mb-2">02</div>
              <h3 className="text-text-primary font-semibold mb-1">Plan Events</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Create events with parties, role slots, and compositions. Members sign up with their preferred roles.
              </p>
            </div>
            <div>
              <div className="text-accent font-mono text-xs font-bold mb-2">03</div>
              <h3 className="text-text-primary font-semibold mb-1">Assign Roles</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Drag-and-drop players into composition slots. See everyone's gear specialization at a glance.
              </p>
            </div>
            <div>
              <div className="text-accent font-mono text-xs font-bold mb-2">04</div>
              <h3 className="text-text-primary font-semibold mb-1">Distribute Loot</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Run loot tab sales with fair draw system. Track silver balances and splits for every member.
              </p>
            </div>
            <div>
              <div className="text-accent font-mono text-xs font-bold mb-2">05</div>
              <h3 className="text-text-primary font-semibold mb-1">Discord Integration</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Slash commands for balance checks, loot signups, and draws. Get notified right in your server.
              </p>
            </div>
            <div>
              <div className="text-accent font-mono text-xs font-bold mb-2">06</div>
              <h3 className="text-text-primary font-semibold mb-1">Track Everything</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Full audit log of all actions. Balance history, regear requests, and member activity at your fingertips.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
