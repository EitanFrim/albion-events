import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AssignmentBoard } from '@/components/AssignmentBoard'
import { DeleteEventButton } from '@/components/DeleteEventButton'
import { CompleteEventButton } from '@/components/CompleteEventButton'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AssignmentBoardPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/')

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

  if (!event) notFound()

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
        <Link href={`/events/${params.id}`} className="btn-ghost text-xs">← Event</Link>
        <Link href={`/admin/events/${params.id}/edit`} className="btn-ghost text-xs">Edit</Link>
        <div className="flex-1">
          <h1 className="heading-display text-xl sm:text-2xl">{event.title}</h1>
          <p className="text-silver-dim text-xs font-mono">
            {format(new Date(event.startTime), 'MMM d, yyyy · HH:mm')} UTC · {event.status}
          </p>
        </div>
        {event.status !== 'COMPLETED' && <CompleteEventButton eventId={params.id} />}
        <DeleteEventButton eventId={params.id} eventTitle={event.title} />
      </div>

      <AssignmentBoard
        event={{ id: event.id, status: event.status as any, title: event.title }}
        parties={event.parties as any}
        signups={signups as any}
      />
    </div>
  )
}
