import { prisma } from './prisma'
import { adjustBalance } from './balance'

interface ImportEntry {
  playerName: string
  amount: number
}

interface ImportResult {
  applied: number
  pending: number
  skippedZero: number
  updated: number
}

export async function importBalances(
  guildId: string,
  performedById: string,
  entries: ImportEntry[]
): Promise<ImportResult> {
  // Load all guild members with their in-game names
  const members = await prisma.guildMembership.findMany({
    where: { guildId },
    include: { user: { select: { inGameName: true, discordName: true } } },
  })

  // Build lookup: lowercase name → membership
  const nameToMembership = new Map<string, typeof members[number]>()
  for (const m of members) {
    if (m.user.inGameName) {
      nameToMembership.set(m.user.inGameName.toLowerCase(), m)
    }
    // Also match on discord name as fallback
    if (m.user.discordName) {
      const key = m.user.discordName.toLowerCase()
      if (!nameToMembership.has(key)) {
        nameToMembership.set(key, m)
      }
    }
  }

  let applied = 0
  let pending = 0
  let skippedZero = 0
  let updated = 0

  for (const entry of entries) {
    if (entry.amount === 0) {
      skippedZero++
      continue
    }

    const membership = nameToMembership.get(entry.playerName.toLowerCase())

    if (membership) {
      // Player is registered — apply balance directly
      await adjustBalance({
        membershipId: membership.id,
        amount: entry.amount,
        reason: 'Balance import',
        performedById,
      })
      applied++
    } else {
      // Player not registered — store as pending (upsert to handle re-imports)
      const existing = await prisma.pendingBalanceImport.findUnique({
        where: { guild_player_pending: { guildId, playerName: entry.playerName } },
      })

      if (existing) {
        // Don't reset already-applied imports
        if (existing.appliedAt) {
          skippedZero++
          continue
        }
        await prisma.pendingBalanceImport.update({
          where: { id: existing.id },
          data: { amount: entry.amount, importedById: performedById },
        })
        updated++
      } else {
        await prisma.pendingBalanceImport.create({
          data: {
            guildId,
            playerName: entry.playerName,
            amount: entry.amount,
            reason: 'Balance import',
            importedById: performedById,
          },
        })
        pending++
      }
    }
  }

  return { applied, pending, skippedZero, updated }
}

/**
 * Called after a player registers or sets their IGN.
 * Checks for any pending balance imports that match their name and applies them.
 * Each import can only be claimed once per Discord account.
 */
export async function applyPendingBalanceImports(
  userId: string,
  guildId: string
): Promise<number> {
  // Check if this user already claimed any imports in this guild
  const alreadyClaimed = await prisma.pendingBalanceImport.findFirst({
    where: { guildId, appliedToUserId: userId },
  })
  if (alreadyClaimed) return 0

  // Get the user's names
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { inGameName: true, discordName: true },
  })
  if (!user) return 0

  // Find matching pending imports by name (case-insensitive)
  const names = [user.inGameName, user.discordName].filter(Boolean).map(n => n!.toLowerCase())
  if (names.length === 0) return 0

  const pendingImports = await prisma.pendingBalanceImport.findMany({
    where: {
      guildId,
      appliedAt: null,
    },
  })

  // Filter by case-insensitive name match
  const matching = pendingImports.filter(p =>
    names.includes(p.playerName.toLowerCase())
  )

  if (matching.length === 0) return 0

  // Get the membership
  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId, guildId } },
  })
  if (!membership) return 0

  let totalApplied = 0

  for (const imp of matching) {
    await adjustBalance({
      membershipId: membership.id,
      amount: imp.amount,
      reason: 'Balance import (applied on registration)',
      performedById: imp.importedById,
    })

    await prisma.pendingBalanceImport.update({
      where: { id: imp.id },
      data: { appliedAt: new Date(), appliedToUserId: userId },
    })

    totalApplied += imp.amount
  }

  return totalApplied
}
