import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { EventBuilderForm } from '@/components/EventBuilderForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string; id: string } }

export default async function GuildEditEventPage({ params }: Props) {
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
      parties: { orderBy: { displayOrder: 'asc' }, include: { roleSlots: { orderBy: { displayOrder: 'asc' } } } },
    },
  })

  if (!event || event.guildId !== guild.id) notFound()

  const initialData = {
    title: event.title,
    description: event.description ?? '',
    startTime: event.startTime.toISOString().slice(0, 16),
    timezone: event.timezone,
    locationNote: event.locationNote ?? '',
    visibility: event.visibility,
    parties: event.parties.map(p => ({
      id: p.id,
      name: p.name,
      roleSlots: p.roleSlots.map(s => ({
        roleName: s.roleName, capacity: s.capacity,
        tags: s.tags.join(', '), minIp: s.minIp?.toString() ?? '',
      })),
    })),
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/g/${params.slug}/events/${params.id}`} className="btn-ghost text-sm py-1.5">← Back</Link>
        <div>
          <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-0.5">{guild.name}</p>
          <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">Edit Content</h1>
        </div>
      </div>
      <EventBuilderForm initialData={initialData as any} eventId={event.id} guildSlug={params.slug} />
    </div>
  )
}
