import { prisma } from './prisma'

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function getGuildBySlug(slug: string) {
  return prisma.guild.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, discordName: true, inGameName: true } },
      _count: { select: { members: true, events: true } },
    },
  })
}

export async function getMembership(userId: string, guildId: string) {
  return prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId, guildId } },
  })
}

export async function requireGuildAccess(
  userId: string,
  guildId: string,
  minRole: 'PLAYER' | 'OFFICER' | 'OWNER' = 'PLAYER'
) {
  const membership = await getMembership(userId, guildId)
  if (!membership || membership.status !== 'ACTIVE') return null

  const roleRank = { PLAYER: 0, OFFICER: 1, OWNER: 2 }
  if (roleRank[membership.role] < roleRank[minRole]) return null

  return membership
}
