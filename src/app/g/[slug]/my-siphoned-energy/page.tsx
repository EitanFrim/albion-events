import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { MySiphonedEnergyLogs } from '@/components/MySiphonedEnergyLogs'
import { AnimatedPage } from '@/components/motion/AnimatedPage'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function MySiphonedEnergyPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })
  if (!membership || membership.status !== 'ACTIVE') redirect(`/g/${params.slug}`)

  return (
    <AnimatedPage className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">Personal</p>
        <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">My Siphoned Energy</h1>
        <p className="text-text-secondary text-sm mt-1">Your siphoned energy transaction history.</p>
      </div>
      <MySiphonedEnergyLogs guildSlug={params.slug} currentEnergy={membership.siphonedEnergy} />
    </AnimatedPage>
  )
}
