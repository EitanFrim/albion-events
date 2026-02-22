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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">

      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">{guild.name}</p>
        <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight mb-2">How It Works</h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Five steps to go from a fresh guild to a fully organised content run.
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
