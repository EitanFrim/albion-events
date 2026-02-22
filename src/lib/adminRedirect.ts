import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

/**
 * Finds the user's first active guild membership and returns the slug.
 * Redirects to / if they have no guilds.
 */
export async function getFirstGuildSlug(): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const membership = await prisma.guildMembership.findFirst({
    where: { userId: session.user.id, status: 'ACTIVE', role: { in: ['OWNER', 'OFFICER'] } },
    include: { guild: { select: { slug: true } } },
    orderBy: { joinedAt: 'asc' },
  })

  if (!membership) redirect('/')
  return membership.guild.slug
}
