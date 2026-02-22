import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GuildNavBar } from '@/components/GuildNavBar'

interface Props {
  children: React.ReactNode
  params: { slug: string }
}

export default async function GuildLayout({ children, params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({
    where: { slug: params.slug },
  })

  if (!guild) notFound()

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })

  // Must be a member (any status) to see guild pages
  // PENDING members can see the guild but get limited access
  if (!membership) {
    redirect(`/?error=not-a-member`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <GuildNavBar
        guild={{ id: guild.id, name: guild.name, slug: guild.slug, logoUrl: guild.logoUrl }}
        membership={{ role: membership.role, status: membership.status }}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
