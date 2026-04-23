import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'

interface ResolveUserOptions {
  /**
   * When true and the token resolves to a Discord user that has no User row
   * yet, upsert one from the token's `discordUserId` + `discordUsername`.
   * Use for first-touch endpoints (signup POST). Default false so endpoints
   * that operate on existing entities (regears, signup edits) don't silently
   * provision users.
   */
  upsertFromToken?: boolean
}

/**
 * Resolve user from either session or event signup token.
 * Tries session first, falls back to ?token= query param.
 * Returns the user ID or null if neither auth method works.
 */
export async function resolveUser(
  req: NextRequest,
  eventId: string,
  opts: ResolveUserOptions = {}
): Promise<{ id: string; fromToken: boolean } | null> {
  // Try session first
  const session = await getServerSession(authOptions)
  if (session) return { id: session.user.id, fromToken: false }

  // Try token
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return null

  const signupToken = await prisma.eventSignupToken.findUnique({
    where: { token },
  })
  if (!signupToken || signupToken.eventId !== eventId) return null

  if (opts.upsertFromToken) {
    const user = await prisma.user.upsert({
      where: { discordUserId: signupToken.discordUserId },
      create: {
        discordUserId: signupToken.discordUserId,
        discordName: signupToken.discordUsername,
      },
      update: {},
    })
    return { id: user.id, fromToken: true }
  }

  const user = await prisma.user.findUnique({
    where: { discordUserId: signupToken.discordUserId },
  })
  if (!user) return null

  return { id: user.id, fromToken: true }
}
