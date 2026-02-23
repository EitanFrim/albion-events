import { prisma } from './prisma'

interface AdjustBalanceParams {
  membershipId: string
  amount: number
  reason?: string
  performedById: string
}

interface AdjustBalanceResult {
  newBalance: number
  transaction: {
    id: string
    amount: number
    balanceAfter: number
    reason: string | null
    createdAt: Date
  }
}

export async function adjustBalance({
  membershipId,
  amount,
  reason,
  performedById,
}: AdjustBalanceParams): Promise<AdjustBalanceResult> {
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.guildMembership.update({
      where: { id: membershipId },
      data: { balance: { increment: amount } },
    })

    const transaction = await tx.balanceTransaction.create({
      data: {
        membershipId,
        amount,
        balanceAfter: updated.balance,
        reason: reason ?? null,
        performedById,
      },
    })

    return { newBalance: updated.balance, transaction }
  })

  return result
}
