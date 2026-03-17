import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'

/**
 * Resolve user from either session or event signup token.
 * Tries session first, falls back to ?token= query param.
 * Returns the user ID or null if neither auth method works.
 */
export async function resolveUser(
  req: NextRequest,
  eventId: string
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

  const user = await prisma.user.findUnique({
    where: { discordUserId: signupToken.discordUserId },
  })
  if (!user) return null

  return { id: user.id, fromToken: true }
}
