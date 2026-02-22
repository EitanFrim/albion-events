import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { RolesManager } from '@/components/RolesManager'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function GuildRolesPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'OFFICER')) redirect(`/g/${params.slug}`)

  const categories = await prisma.guildCategory.findMany({
    where: { guildId: guild.id },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: { roles: { where: { guildId: guild.id }, orderBy: { name: 'asc' } } },
  })
  const roles = await prisma.guildRole2.findMany({
    where: { guildId: guild.id },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: { category: true },
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">Guild Management</p>
        <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">Roles</h1>
        <p className="text-text-secondary text-sm mt-1">Define role categories and available roles for events.</p>
      </div>
      <RolesManager initialCategories={categories as any} initialRoles={roles as any} guildSlug={params.slug} />
    </div>
  )
}
