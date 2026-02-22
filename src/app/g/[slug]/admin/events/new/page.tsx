import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { EventBuilderForm } from '@/components/EventBuilderForm'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function GuildNewEventPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'OFFICER')) redirect(`/g/${params.slug}`)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">{guild.name}</p>
        <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight mb-1">Create Content</h1>
        <p className="text-text-secondary text-sm">Schedule new guild content and configure party compositions.</p>
      </div>
      <EventBuilderForm guildSlug={params.slug} />
    </div>
  )
}
