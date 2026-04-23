import { prisma } from './prisma'
import type { Signup } from '@prisma/client'

interface UpsertSignupParams {
  userId: string
  eventId: string
  preferredRoles: string[]
  note?: string | null
  /**
   * When true, the call fails with 409 if there is already an ACTIVE signup
   * for this user/event. Use for first-time signup endpoints (POST). Update
   * endpoints (PUT) should pass false.
   */
  rejectIfActive?: boolean
}

type SignupWithUser = Signup & {
  user: { id: string; discordName: string; avatarUrl: string | null }
}

export type UpsertSignupResult =
  | { ok: true; signup: SignupWithUser; wasNew: boolean }
  | { ok: false; status: number; error: string }

/**
 * Centralised signup upsert with all event-status and membership checks.
 *
 * Used by both the session-based and token-based signup endpoints so the
 * authorisation rules stay in lockstep.
 */
export async function upsertSignup({
  userId,
  eventId,
  preferredRoles,
  note,
  rejectIfActive = false,
}: UpsertSignupParams): Promise<UpsertSignupResult> {
  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) return { ok: false, status: 404, error: 'Event not found.' }
  if (event.status !== 'PUBLISHED') {
    return { ok: false, status: 400, error: 'Event is not open for signups.' }
  }

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId, guildId: event.guildId } },
  })
  if (!membership || membership.status !== 'ACTIVE' || membership.role === 'GUEST') {
    return {
      ok: false,
      status: 403,
      error: 'You must be a registered guild member to sign up. Apply to join the guild first.',
    }
  }

  const existing = await prisma.signup.findUnique({
    where: { eventId_userId: { eventId, userId } },
  })

  if (rejectIfActive && existing && existing.status === 'ACTIVE') {
    return { ok: false, status: 409, error: 'Already signed up. Use PUT to update.' }
  }

  const signup = await prisma.signup.upsert({
    where: { eventId_userId: { eventId, userId } },
    update: { preferredRoles, note: note ?? null, status: 'ACTIVE' },
    create: {
      eventId,
      userId,
      preferredRoles,
      note: note ?? null,
      status: 'ACTIVE',
    },
    include: { user: { select: { id: true, discordName: true, avatarUrl: true } } },
  })

  return { ok: true, signup, wasNew: !existing }
}
