import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { LootSplitForm } from '@/components/LootSplitForm'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function LootSplitPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const myMembership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })

  if (!myMembership || (myMembership.role !== 'OWNER' && myMembership.role !== 'OFFICER')) {
    redirect(`/g/${params.slug}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">Guild Management</p>
        <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">Loot Split</h1>
        <p className="text-text-secondary text-sm mt-1">
          Calculate and distribute silver from content runs to guild members.
        </p>
      </div>
      <LootSplitForm guildSlug={params.slug} />
    </div>
  )
}
