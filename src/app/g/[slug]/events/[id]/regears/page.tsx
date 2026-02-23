import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { RegearsManager } from '@/components/RegearsManager'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string; id: string } }

export default async function RegearsPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })

  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'OFFICER')) {
    redirect(`/g/${params.slug}/events/${params.id}`)
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, guildId: true },
  })

  if (!event || event.guildId !== guild.id) notFound()

  const pendingCount = await prisma.regearRequest.count({
    where: { eventId: params.id, status: 'PENDING' },
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <Link href={`/g/${params.slug}/events/${params.id}`} className="btn-ghost text-xs mb-4 inline-flex">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Event
        </Link>
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">{event.title}</p>
        <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">Regear Requests</h1>
        <p className="text-text-secondary text-sm mt-1">
          {pendingCount > 0
            ? `${pendingCount} request${pendingCount !== 1 ? 's' : ''} awaiting review.`
            : 'All requests have been reviewed.'}
        </p>
      </div>

      <RegearsManager eventId={params.id} guildSlug={params.slug} />
    </div>
  )
}
