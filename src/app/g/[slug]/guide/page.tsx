import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
interface Props { params: { slug: string } }

export default async function GuidePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })
  if (!membership || membership.status !== 'ACTIVE') redirect(`/g/${params.slug}`)

  const isOfficerPlus = membership.role === 'OWNER' || membership.role === 'OFFICER'
  const slug = params.slug

  /* ── helper: Discord step bubble ── */
  function discordStep(n: number) {
    return (
      <span className="font-mono text-xs font-700 text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/20 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
        {n}
      </span>
    )
  }

  /* ── helper: orange step bubble ── */
  function webStep(n: string) {
    return (
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center z-10">
        <span className="font-mono text-xs font-700 text-accent">{n}</span>
      </div>
    )
  }

  /* ── helper: tip box ── */
  function tip(text: string) {
    return (
      <div className="flex items-start gap-2 bg-accent/5 border border-accent/15 rounded-lg px-3 py-2 mt-3">
        <span className="text-accent text-xs mt-0.5 flex-shrink-0">💡</span>
        <p className="text-xs text-text-secondary leading-relaxed">{text}</p>
      </div>
    )
  }

  /* ── helper: command block ── */
  function cmd(...parts: { text: string; color?: string }[]) {
    return (
      <div className="bg-bg-base border border-border rounded-lg px-4 py-3 font-mono text-sm mt-2">
        {parts.map((p, i) => (
          <span key={i} className={p.color ?? 'text-text-muted'}>{p.text}</span>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">

      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-mono text-accent uppercase tracking-widest mb-2">{guild.name}</p>
        <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight mb-2">How It Works</h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Get your guild up and running — start with the Discord bot for the fastest player onboarding, then set up roles, builds, and content.
        </p>
      </div>

      {/* ╔══════════════════════════════════════╗
         ║  SECTION 1 — DISCORD BOT SETUP       ║
         ╚══════════════════════════════════════╝ */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-xl font-800 text-text-primary tracking-tight">Discord Bot Setup</h2>
            <p className="text-text-secondary text-xs">The fastest way to get players registered — they just click a button.</p>
          </div>
        </div>

        {isOfficerPlus && (
          <div className="space-y-4">
            {/* 1 — Install */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                {discordStep(1)}
                <h3 className="font-display font-700 text-text-primary">Install the Bot</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Go to <Link href={`/g/${slug}/settings`} className="text-accent hover:text-accent/80 transition-colors">Guild Settings</Link> → Discord Bot section and click <span className="font-semibold text-text-primary">Install Bot</span>. This opens Discord and asks you to add the bot to your server.
              </p>
              {tip('You must be the guild Owner on Albion Events and have Administrator permissions in your Discord server.')}
            </div>

            {/* 2 — Link server + set region */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                {discordStep(2)}
                <h3 className="font-display font-700 text-text-primary">Link your server &amp; set region</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-2">
                Run the setup command in your Discord server to link it to your Albion Events guild. Include the <span className="text-text-primary font-medium">server-region</span> option so the bot can verify player names against the Albion Online API.
              </p>
              {cmd(
                { text: '/' },
                { text: 'setup', color: 'text-accent' },
                { text: ' server-region:' },
                { text: 'americas', color: 'text-emerald-400' },
              )}
              {tip('Available regions: americas, europe, asia. You can also set the region in Guild Settings on the web.')}
            </div>

            {/* 3 — Member role */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                {discordStep(3)}
                <h3 className="font-display font-700 text-text-primary">Set the member role (optional)</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-2">
                Restrict registration to players with a specific Discord role. Only users with this role can use the Register button.
              </p>
              {cmd(
                { text: '/' },
                { text: 'setup', color: 'text-accent' },
                { text: ' member-role:' },
                { text: '@YourMemberRole', color: 'text-purple-400' },
              )}
              {tip('Skip this if you want anyone in the Discord server to register freely. You can combine all options: /setup server-region:americas member-role:@Members alliance-role:@Alliance')}
            </div>

            {/* 4 — Alliance role */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                {discordStep(4)}
                <h3 className="font-display font-700 text-text-primary">Set the alliance role (optional)</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-2">
                If your guild has alliance members with a separate Discord role, configure it so they register as <span className="text-sky-400 font-semibold">Alliance</span> instead of Member.
              </p>
              {cmd(
                { text: '/' },
                { text: 'setup', color: 'text-accent' },
                { text: ' alliance-role:' },
                { text: '@YourAllianceRole', color: 'text-sky-400' },
              )}
            </div>

            {/* 5 — Post verify button */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                {discordStep(5)}
                <h3 className="font-display font-700 text-text-primary">Post the Register button</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-2">
                Run this command in a channel (e.g. #verification). It posts an embed with a <span className="text-emerald-400 font-semibold">Register</span> button players can click.
              </p>
              {cmd(
                { text: '/' },
                { text: 'verify-message', color: 'text-accent' },
              )}
              {tip('That\'s it! Players click Register, the bot checks their Discord server nickname against the Albion Online API, and if it matches they\'re instantly verified — no manual approval needed.')}
            </div>
          </div>
        )}

        {/* Player-facing: how to register */}
        <div className={`card p-5 ${isOfficerPlus ? 'mt-4' : ''}`}>
          <div className="flex items-center gap-2.5 mb-2">
            <svg className="w-5 h-5 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="font-display font-700 text-text-primary">For Players: How to Register</h3>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            Registration is instant via Discord. Two ways to join:
          </p>
          <div className="space-y-2 mb-3">
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-400 text-sm mt-0.5 flex-shrink-0">✅</span>
              <p className="text-text-secondary text-sm">Click the <span className="font-semibold text-emerald-400">Register</span> button in your Discord&apos;s verification channel.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-accent text-sm mt-0.5 flex-shrink-0">⌨️</span>
              <p className="text-text-secondary text-sm">Or type <code className="text-accent font-mono text-xs bg-bg-base border border-border rounded px-1.5 py-0.5">/register</code> in any channel.</p>
            </div>
          </div>
          <div className="rounded-lg bg-bg-elevated border border-border-subtle p-3 space-y-2 text-sm">
            <p className="text-text-primary font-medium text-xs">Important:</p>
            <p className="text-text-secondary text-xs leading-relaxed">
              Your <span className="text-text-primary font-medium">Discord server nickname</span> must match your <span className="text-text-primary font-medium">Albion Online in-game name</span> exactly. The bot verifies your nickname against the Albion API. If it doesn&apos;t match, change your server nickname first, then click Register again.
            </p>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed mt-3">
            Once registered, you can check your silver balance anytime:
          </p>
          {cmd({ text: '/' }, { text: 'bal', color: 'text-accent' })}
          {tip('You can also view your full balance history on the web by clicking your silver balance in the navigation bar.')}
        </div>

        {/* Bot Commands Reference */}
        <div className="card p-5 mt-4">
          <div className="flex items-center gap-2.5 mb-3">
            <svg className="w-5 h-5 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="font-display font-700 text-text-primary">Bot Commands Reference</h3>
          </div>
          <div className="space-y-0">
            {[
              { cmd: '/setup', desc: 'Link your Discord server, set server region, member role, and alliance role. Admin only.', options: 'server-region, member-role, alliance-role' },
              { cmd: '/verify-message', desc: 'Post a verification embed with a Register button. Admin only.' },
              { cmd: '/register', desc: 'Register as a guild member. Verifies your server nickname against Albion Online.' },
              { cmd: '/bal', desc: 'Check your own silver balance.' },
              { cmd: '/balance add', desc: 'Add silver to a player\'s balance with a reason. Officer only.' },
              { cmd: '/balance deduct', desc: 'Deduct silver from a player\'s balance. Officer only.' },
              { cmd: '/balance check', desc: 'Check a specific player\'s balance. Officer only.' },
            ].map((item, i, arr) => (
              <div key={item.cmd} className={`flex items-start gap-3 py-2.5 ${i < arr.length - 1 ? 'border-b border-border-subtle' : ''}`}>
                <code className="text-accent font-mono text-xs bg-bg-base border border-border rounded px-2 py-1 flex-shrink-0">{item.cmd}</code>
                <div>
                  <p className="text-text-secondary text-xs leading-relaxed">{item.desc}</p>
                  {item.options && (
                    <p className="text-text-muted text-[10px] font-mono mt-0.5">Options: {item.options}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ╔══════════════════════════════════════╗
         ║  SECTION 2 — WEB APP SETUP           ║
         ╚══════════════════════════════════════╝ */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-xl font-800 text-text-primary tracking-tight">Guild Setup</h2>
            <p className="text-text-secondary text-xs">Set up roles, builds, and content on the web.</p>
          </div>
        </div>

        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[19px] top-10 bottom-10 w-px bg-border-subtle" />

          <div className="space-y-2">
            {/* Step 1: Roles */}
            <div className="relative flex gap-5">
              {webStep('01')}
              <div className="flex-1 card p-5 mb-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="font-display font-700 text-text-primary">Set up your Roles</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Go to Roles and create Categories first — for example Tank, Support, and DPS. Give each category a color. Then add the individual weapon roles inside each category (e.g. Frost Staff, Hammer, Bow).
                </p>
                {tip('You can export and import roles as JSON to quickly copy setups between guilds.')}
                <div className="mt-3">
                  <Link href={`/g/${slug}/admin/roles`} className="text-xs font-mono text-accent hover:text-accent/80 transition-colors">Go to Roles →</Link>
                </div>
              </div>
            </div>

            {/* Step 2: Builds */}
            <div className="relative flex gap-5">
              {webStep('02')}
              <div className="flex-1 card p-5 mb-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="font-display font-700 text-text-primary">Create a Build</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Go to Builds and click New Build. Name it (e.g. &quot;10v10 Kite&quot;), add parties, and fill each slot with a weapon role and player count. You can duplicate builds and parties to quickly create variations.
                </p>
                {tip('Builds can be exported/imported as JSON. Use Duplicate to clone an existing build as a starting point.')}
                <div className="mt-3">
                  <Link href={`/g/${slug}/admin/templates`} className="text-xs font-mono text-accent hover:text-accent/80 transition-colors">Go to Builds →</Link>
                </div>
              </div>
            </div>

            {/* Step 3: Content */}
            <div className="relative flex gap-5">
              {webStep('03')}
              <div className="flex-1 card p-5 mb-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="font-display font-700 text-text-primary">Create Content</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Click <span className="text-text-primary font-medium">+ New Content</span> in the nav. Fill in the title, date, and time. Pick a Build to auto-fill the party layout. Save as Draft until ready.
                </p>
                {tip('You can still adjust individual slots after applying a build.')}
                <div className="mt-3">
                  <Link href={`/g/${slug}/admin/events/new`} className="text-xs font-mono text-accent hover:text-accent/80 transition-colors">Create Content →</Link>
                </div>
              </div>
            </div>

            {/* Step 4: Publish */}
            <div className="relative flex gap-5">
              {webStep('04')}
              <div className="flex-1 card p-5 mb-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <h3 className="font-display font-700 text-text-primary">Publish &amp; Share</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Open the content, hit Publish, then copy the link and drop it in your Discord. Players click the link, pick their preferred weapon roles (up to 3 in priority order), and sign up. You assign slots from the Assign page.
                </p>
                {tip('Players can sign up on any device — they just need their Discord login.')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ╔══════════════════════════════════════╗
         ║  SECTION 3 — MANAGEMENT FEATURES     ║
         ╚══════════════════════════════════════╝ */}
      {isOfficerPlus && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-xl font-800 text-text-primary tracking-tight">Guild Management</h2>
              <p className="text-text-secondary text-xs">Everything under the Management dropdown in the nav bar.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Players */}
            <div className="card p-5">
              <h3 className="font-display font-700 text-text-primary mb-2">Players</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                View and manage all guild members. Verify pending players, adjust roles, and track balances. You can sort by name, role, balance, or join date.
              </p>
              <div className="mt-3 space-y-1.5">
                <p className="text-xs text-text-secondary"><span className="text-emerald-400 font-medium">Suspend</span> — temporarily removes a player but preserves their balance. They can re-register and get their silver back.</p>
                <p className="text-xs text-text-secondary"><span className="text-red-400 font-medium">Remove</span> — permanently deletes the player and their balance. Cannot be undone.</p>
              </div>
            </div>

            {/* Loot Split */}
            <div className="card p-5">
              <h3 className="font-display font-700 text-text-primary mb-2">Loot Split</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Distribute silver from content runs. Enter the sold amount, silver bags, repair cost, and guild tax. Add players individually or use <span className="text-text-primary font-medium">Bulk Add</span> to paste a list of in-game names (one per line) — they&apos;ll be matched against your roster automatically.
              </p>
              {tip('Each player gets a configurable cut percentage (default 100%). The split is calculated live as you adjust values.')}
            </div>

            {/* Balance Logs */}
            <div className="card p-5">
              <h3 className="font-display font-700 text-text-primary mb-2">Balance Logs</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Full audit trail of every silver transaction across the guild — loot splits, manual adjustments, and deductions. Searchable by player name or reason.
              </p>
            </div>

            {/* Total Silver */}
            <div className="card p-5">
              <h3 className="font-display font-700 text-text-primary mb-2">Guild Total Silver</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                The Management dropdown in the nav bar shows the total silver the guild owes across all active player balances. This is the sum of all individual balances — useful for tracking how much silver needs to be paid out.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="card p-6 text-center">
        <p className="text-text-secondary text-sm mb-4">Ready to run your first content?</p>
        <Link href={`/g/${slug}`} className="btn-primary">
          Go to Contents →
        </Link>
      </div>

    </div>
  )
}
