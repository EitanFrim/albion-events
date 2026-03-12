import { prisma } from './prisma'

/* ─── Manual adjust (mirrors adjustBalance) ─── */

interface AdjustEnergyParams {
  membershipId: string
  guildId: string
  playerName: string
  amount: number
  reason?: string
  performedById: string
}

export async function adjustSiphonedEnergy({
  membershipId,
  guildId,
  playerName,
  amount,
  reason,
  performedById,
}: AdjustEnergyParams) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.guildMembership.update({
      where: { id: membershipId },
      data: { siphonedEnergy: { increment: amount } },
    })

    const transaction = await tx.siphonedEnergyTransaction.create({
      data: {
        guildId,
        membershipId,
        playerName,
        amount,
        energyAfter: updated.siphonedEnergy,
        reason: reason ?? null,
        logDate: new Date(),
        performedById,
      },
    })

    return { newEnergy: updated.siphonedEnergy, transaction }
  })
}

/* ─── Bulk import from TSV logs ─── */

interface LogEntry {
  date: string      // "2026-03-12 15:06:51"
  playerName: string
  reason: string
  amount: number
}

interface ImportResult {
  imported: number
  skipped: number
  orphaned: number
}

export async function importSiphonedEnergyLogs(
  guildId: string,
  performedById: string,
  entries: LogEntry[],
): Promise<ImportResult> {
  return prisma.$transaction(async (tx) => {
    // 1. Gather unique player names
    const uniqueNames = [...new Set(entries.map(e => e.playerName))]

    // 2. Batch-lookup IGN → membership mapping (case-insensitive)
    const memberships = await tx.guildMembership.findMany({
      where: {
        guildId,
        status: 'ACTIVE',
        user: {
          inGameName: { in: uniqueNames, mode: 'insensitive' },
        },
      },
      include: { user: { select: { inGameName: true } } },
    })

    const nameToMembership = new Map<string, { id: string; siphonedEnergy: number }>()
    for (const m of memberships) {
      if (m.user.inGameName) {
        nameToMembership.set(m.user.inGameName.toLowerCase(), { id: m.id, siphonedEnergy: m.siphonedEnergy })
      }
    }

    // Track balance increments per membership
    const membershipIncrements = new Map<string, number>()

    let imported = 0
    let skipped = 0
    let orphaned = 0

    for (const entry of entries) {
      const logDate = new Date(entry.date)
      if (isNaN(logDate.getTime())) {
        skipped++
        continue
      }

      // Check for duplicate
      const existing = await tx.siphonedEnergyTransaction.findUnique({
        where: {
          dedup_key: {
            guildId,
            playerName: entry.playerName,
            logDate,
            amount: entry.amount,
          },
        },
      })

      if (existing) {
        skipped++
        continue
      }

      const match = nameToMembership.get(entry.playerName.toLowerCase())

      await tx.siphonedEnergyTransaction.create({
        data: {
          guildId,
          membershipId: match?.id ?? null,
          playerName: entry.playerName,
          amount: entry.amount,
          energyAfter: null, // Will be set after all increments
          reason: entry.reason || null,
          logDate,
          performedById,
        },
      })

      if (match) {
        const prev = membershipIncrements.get(match.id) ?? 0
        membershipIncrements.set(match.id, prev + entry.amount)
        imported++
      } else {
        orphaned++
        imported++
      }
    }

    // 3. Batch-update siphonedEnergy for matched memberships
    for (const [membershipId, increment] of membershipIncrements) {
      await tx.guildMembership.update({
        where: { id: membershipId },
        data: { siphonedEnergy: { increment } },
      })
    }

    return { imported, skipped, orphaned }
  })
}

/* ─── Link orphaned transactions when a player sets/changes IGN ─── */

export async function linkOrphanedEnergyTransactions(
  userId: string,
  inGameName: string,
) {
  // Find all guilds the user is active in
  const memberships = await prisma.guildMembership.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { id: true, guildId: true },
  })

  for (const membership of memberships) {
    await prisma.$transaction(async (tx) => {
      // Find orphaned transactions matching this IGN (case-insensitive)
      const orphaned = await tx.siphonedEnergyTransaction.findMany({
        where: {
          guildId: membership.guildId,
          membershipId: null,
          playerName: { equals: inGameName, mode: 'insensitive' },
        },
      })

      if (orphaned.length === 0) return

      // Link them
      await tx.siphonedEnergyTransaction.updateMany({
        where: {
          id: { in: orphaned.map(o => o.id) },
        },
        data: { membershipId: membership.id },
      })

      // Update balance
      const totalAmount = orphaned.reduce((sum, o) => sum + o.amount, 0)
      await tx.guildMembership.update({
        where: { id: membership.id },
        data: { siphonedEnergy: { increment: totalAmount } },
      })
    })
  }
}
