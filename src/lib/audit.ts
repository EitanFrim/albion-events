import { prisma } from './prisma'

export async function auditLog(
  eventId: string,
  userId: string,
  action: string,
  details?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: { eventId, userId, action, details: details ?? {} },
  })
}
