import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AssignmentBoard } from '@/components/AssignmentBoard'
import { DeleteEventButton } from '@/components/DeleteEventButton'
import { CompleteEventButton } from '@/components/CompleteEventButton'
import { UnlockEventButton } from '@/components/UnlockEventButton'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string; id: string } }

export default async function GuildAssignmentBoardPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'OFFICER')) redirect(`/g/${params.slug}`)

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      parties: {
        orderBy: { displayOrder: 'asc' },
        include: {
          roleSlots: {
            orderBy: { displayOrder: 'asc' },
            include: {
              assignments: {
                include: {
                  user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
                  signup: { select: { preferredRoles: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!event || event.guildId !== guild.id) notFound()

  const signups = await prisma.signup.findMany({
    where: { eventId: params.id, status: { in: ['ACTIVE', 'WITHDRAWN'] } },
    include: {
      user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } },
      assignment: { include: { roleSlot: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link href={`/g/${params.slug}/events/${params.id}`} className="btn-ghost text-xs">← Content</Link>
        <Link href={`/g/${params.slug}/admin/events/${params.id}/edit`} className="btn-ghost text-xs">Edit</Link>
        <div className="flex-1">
          <h1 className="font-display text-xl sm:text-2xl font-700 text-text-primary">{event.title}</h1>
          <p className="text-text-muted text-xs font-mono">
            {format(new Date(event.startTime), 'MMM d, yyyy · HH:mm')} UTC · {event.status}
          </p>
        </div>
        {event.status === 'LOCKED' && <UnlockEventButton eventId={params.id} />}
        {event.status !== 'COMPLETED' && <CompleteEventButton eventId={params.id} guildSlug={params.slug} />}
        <DeleteEventButton eventId={params.id} eventTitle={event.title} guildSlug={params.slug} />
      </div>

      <AssignmentBoard
        event={{ id: event.id, status: event.status as any, title: event.title }}
        parties={event.parties as any}
        signups={signups as any}
        guildSlug={params.slug}
      />
    </div>
  )
}
