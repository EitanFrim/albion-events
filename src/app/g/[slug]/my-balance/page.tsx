import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { MyBalanceLogs } from '@/components/MyBalanceLogs'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function MyBalancePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })
  if (!membership || membership.status !== 'ACTIVE') redirect(`/g/${params.slug}`)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">Personal</p>
        <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">My Balance</h1>
        <p className="text-text-secondary text-sm mt-1">Your silver transaction history.</p>
      </div>
      <MyBalanceLogs guildSlug={params.slug} currentBalance={membership.balance} />
    </div>
  )
}
