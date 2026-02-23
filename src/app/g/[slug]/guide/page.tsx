import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
interface Props { params: { slug: string } }

const steps = [
  {
    number: '01',
    title: 'Invite your players',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    description: 'Go to Guild Settings and copy your invite link. Share it in your Discord server. Players who join will appear as Pending — head to the Players page to verify and activate them.',
    tip: 'Only Active members can sign up for content.',
    link: null,
    linkLabel: null,
  },
  {
    number: '02',
    title: 'Set up your Roles',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    description: 'Go to Roles and create Categories first — for example Tank, Support, and DPS. Give each category a color. Then add the individual weapon roles inside each category (e.g. Frost Staff, Hammer, Bow).',
    tip: 'Role colors carry through to every party board and signup form.',
    link: 'admin/roles',
    linkLabel: 'Go to Roles →',
  },
  {
    number: '03',
    title: 'Create a Build',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    description: 'Go to Builds and click New Build. Name it (e.g. "10v10 Kite"), then add parties and fill each slot with a weapon role and how many players you need for it. You can attach build notes to each slot with gear, IP floor, and strategy.',
    tip: 'Builds save your comp so you can reuse it every week without rebuilding from scratch.',
    link: 'admin/templates',
    linkLabel: 'Go to Builds →',
  },
  {
    number: '04',
    title: 'Create Content',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    description: 'Click + New Content in the nav. Fill in the title, date, and time. In the composition section, pick the Build you just made to auto-fill the party layout. Save it as a Draft until you\'re ready.',
    tip: 'You can still adjust individual slots after applying a build.',
    link: 'admin/events/new',
    linkLabel: 'Create Content →',
  },
  {
    number: '05',
    title: 'Publish & share',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    description: 'Open the content, hit Publish, then copy the link from your browser. Drop it in your Discord. Players click the link, pick their preferred weapon roles (up to 3 in priority order), and sign up. You assign slots from the Assign page.',
    tip: 'Players can sign up on any device — no account needed beyond Discord login.',
    link: null,
    linkLabel: null,
  },
]

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">

      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">{guild.name}</p>
        <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight mb-2">How It Works</h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Five steps to go from a fresh guild to a fully organised content run — plus a guide to setting up the Discord bot.
        </p>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[19px] top-10 bottom-10 w-px bg-border-subtle" />

        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="relative flex gap-5">

              {/* Step number bubble */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center z-10">
                <span className="font-mono text-xs font-700 text-accent">{step.number}</span>
              </div>

              {/* Card */}
              <div className="flex-1 card p-5 mb-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-accent">{step.icon}</span>
                  <h2 className="font-display font-700 text-text-primary">{step.title}</h2>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-3">
                  {step.description}
                </p>
                {/* Tip */}
                <div className="flex items-start gap-2 bg-accent/5 border border-accent/15 rounded-lg px-3 py-2">
                  <span className="text-accent text-xs mt-0.5 flex-shrink-0">💡</span>
                  <p className="text-xs text-text-secondary leading-relaxed">{step.tip}</p>
                </div>
                {/* CTA link */}
                {step.link && (
                  <div className="mt-3">
                    <Link
                      href={`/g/${params.slug}/${step.link}`}
                      className="text-xs font-mono text-accent hover:text-accent/80 transition-colors"
                    >
                      {step.linkLabel}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discord Bot Setup */}
      <div className="mt-12 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-xl font-800 text-text-primary tracking-tight">Discord Bot Setup</h2>
            <p className="text-text-secondary text-xs">Connect your Discord server for auto-verification and balance commands.</p>
          </div>
        </div>

        {/* Step 1: Install the Bot */}
        {isOfficerPlus && (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono text-xs font-700 text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/20 w-6 h-6 rounded-full flex items-center justify-center">1</span>
                <h3 className="font-display font-700 text-text-primary">Install the Bot</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                Go to <Link href={`/g/${params.slug}/settings`} className="text-accent hover:text-accent/80 transition-colors">Guild Settings</Link> → Discord Bot section and click <span className="font-semibold text-text-primary">Install Bot</span>. This will open Discord and ask you to add the bot to your server. You need Administrator permissions in your Discord server.
              </p>
              <div className="flex items-start gap-2 bg-accent/5 border border-accent/15 rounded-lg px-3 py-2">
                <span className="text-accent text-xs mt-0.5 flex-shrink-0">💡</span>
                <p className="text-xs text-text-secondary leading-relaxed">You must be the guild Owner on Albion Events and a Discord server admin.</p>
              </div>
            </div>

            {/* Step 2: Link your server */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono text-xs font-700 text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/20 w-6 h-6 rounded-full flex items-center justify-center">2</span>
                <h3 className="font-display font-700 text-text-primary">Link your Discord server</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                Open your Discord server and run the setup command. This links the Discord server to your Albion Events guild.
              </p>
              <div className="bg-bg-base border border-border rounded-lg px-4 py-3 font-mono text-sm">
                <span className="text-text-muted">/</span><span className="text-accent">setup</span>
              </div>
            </div>

            {/* Step 3: Set the member role */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono text-xs font-700 text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/20 w-6 h-6 rounded-full flex items-center justify-center">3</span>
                <h3 className="font-display font-700 text-text-primary">Set the member role (optional)</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                If you want only players with a specific Discord role to be able to register, run setup with the member-role option. Only users with this role can use the register command.
              </p>
              <div className="bg-bg-base border border-border rounded-lg px-4 py-3 font-mono text-sm">
                <span className="text-text-muted">/</span><span className="text-accent">setup</span> <span className="text-text-muted">member-role:</span><span className="text-purple-400">@YourMemberRole</span>
              </div>
              <div className="flex items-start gap-2 bg-accent/5 border border-accent/15 rounded-lg px-3 py-2 mt-3">
                <span className="text-accent text-xs mt-0.5 flex-shrink-0">💡</span>
                <p className="text-xs text-text-secondary leading-relaxed">Skip this if you want anyone in the Discord server to register freely.</p>
              </div>
            </div>

            {/* Step 4: Post the verify button */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono text-xs font-700 text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/20 w-6 h-6 rounded-full flex items-center justify-center">4</span>
                <h3 className="font-display font-700 text-text-primary">Post the Verify button</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                Run this command in any channel (e.g. #verification or #welcome). It posts an embed message with a <span className="text-emerald-400 font-semibold">Register</span> button that players can click to verify themselves and join the guild instantly.
              </p>
              <div className="bg-bg-base border border-border rounded-lg px-4 py-3 font-mono text-sm">
                <span className="text-text-muted">/</span><span className="text-accent">verify-message</span>
              </div>
              <div className="flex items-start gap-2 bg-accent/5 border border-accent/15 rounded-lg px-3 py-2 mt-3">
                <span className="text-accent text-xs mt-0.5 flex-shrink-0">💡</span>
                <p className="text-xs text-text-secondary leading-relaxed">Players who click Register will be prompted for their in-game name and automatically added as Active members — no manual verification needed.</p>
              </div>
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
            If your guild has the Discord bot set up, you can register in two ways:
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
          <p className="text-text-secondary text-sm leading-relaxed">
            You&apos;ll be asked for your in-game name, then you&apos;re in. You can check your silver balance anytime with:
          </p>
          <div className="bg-bg-base border border-border rounded-lg px-4 py-3 font-mono text-sm mt-2">
            <span className="text-text-muted">/</span><span className="text-accent">bal</span>
          </div>
        </div>

        {/* Bot Commands Reference */}
        <div className="card p-5 mt-4">
          <div className="flex items-center gap-2.5 mb-3">
            <svg className="w-5 h-5 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="font-display font-700 text-text-primary">Bot Commands Reference</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-3 py-2 border-b border-border-subtle">
              <code className="text-accent font-mono text-xs bg-bg-base border border-border rounded px-2 py-1 flex-shrink-0">/setup</code>
              <p className="text-text-secondary text-xs leading-relaxed">Link your Discord server to this guild. Admin only.</p>
            </div>
            <div className="flex items-start gap-3 py-2 border-b border-border-subtle">
              <code className="text-accent font-mono text-xs bg-bg-base border border-border rounded px-2 py-1 flex-shrink-0">/verify-message</code>
              <p className="text-text-secondary text-xs leading-relaxed">Post a verification embed with a Register button. Admin only.</p>
            </div>
            <div className="flex items-start gap-3 py-2 border-b border-border-subtle">
              <code className="text-accent font-mono text-xs bg-bg-base border border-border rounded px-2 py-1 flex-shrink-0">/register</code>
              <p className="text-text-secondary text-xs leading-relaxed">Register as a verified guild member. Sets your in-game name.</p>
            </div>
            <div className="flex items-start gap-3 py-2 border-b border-border-subtle">
              <code className="text-accent font-mono text-xs bg-bg-base border border-border rounded px-2 py-1 flex-shrink-0">/bal</code>
              <p className="text-text-secondary text-xs leading-relaxed">Check your own silver balance.</p>
            </div>
            <div className="flex items-start gap-3 py-2 border-b border-border-subtle">
              <code className="text-accent font-mono text-xs bg-bg-base border border-border rounded px-2 py-1 flex-shrink-0">/balance add</code>
              <p className="text-text-secondary text-xs leading-relaxed">Add silver to a player&apos;s balance with a reason. Officer only.</p>
            </div>
            <div className="flex items-start gap-3 py-2 border-b border-border-subtle">
              <code className="text-accent font-mono text-xs bg-bg-base border border-border rounded px-2 py-1 flex-shrink-0">/balance deduct</code>
              <p className="text-text-secondary text-xs leading-relaxed">Deduct silver from a player&apos;s balance with a reason. Officer only.</p>
            </div>
            <div className="flex items-start gap-3 py-2">
              <code className="text-accent font-mono text-xs bg-bg-base border border-border rounded px-2 py-1 flex-shrink-0">/balance check</code>
              <p className="text-text-secondary text-xs leading-relaxed">Check a specific player&apos;s balance. Officer only.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-6 card p-6 text-center">
        <p className="text-text-secondary text-sm mb-4">Ready to run your first content?</p>
        <Link href={`/g/${params.slug}`} className="btn-primary">
          Go to Contents →
        </Link>
      </div>

    </div>
  )
}
