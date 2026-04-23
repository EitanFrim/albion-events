import { prisma } from './prisma'
import { verifyAlbionName } from './albion'
import { linkOrphanedEnergyTransactions } from './siphoned-energy'
import { applyPendingBalanceImports } from './balance-import'

export type SetIgnResult =
  | { ok: true; inGameName: string }
  | { ok: false; status: number; error: string }

interface SetIgnOptions {
  region?: string | null
}

/**
 * Set a user's in-game name with consistent verification and side effects.
 *
 * - When a region is provided, verifies the name against the Albion API and
 *   normalizes the casing to whatever the API returns.
 * - Always runs the post-IGN side effects: link orphaned siphoned-energy
 *   transactions and apply pending balance imports across the user's guilds.
 *
 * Side-effect failures are swallowed so the IGN write itself is never blocked.
 */
export async function setUserIgn(
  userId: string,
  inGameName: string,
  opts: SetIgnOptions = {}
): Promise<SetIgnResult> {
  const trimmed = inGameName.trim()
  if (!trimmed) {
    return { ok: false, status: 400, error: 'In-game name is required' }
  }

  let finalName = trimmed

  if (opts.region) {
    const result = await verifyAlbionName(finalName, opts.region)
    if (!result.valid) {
      return {
        ok: false,
        status: 400,
        error: `Player "${finalName}" not found in Albion Online. Check the spelling and make sure you're on the correct server region.`,
      }
    }
    if (result.exactName) finalName = result.exactName
  }

  await prisma.user.update({
    where: { id: userId },
    data: { inGameName: finalName },
  })

  try {
    await linkOrphanedEnergyTransactions(userId, finalName)
  } catch {
    // Non-critical
  }

  try {
    const memberships = await prisma.guildMembership.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { guildId: true },
    })
    for (const m of memberships) {
      await applyPendingBalanceImports(userId, m.guildId).catch(() => 0)
    }
  } catch {
    // Non-critical
  }

  return { ok: true, inGameName: finalName }
}
