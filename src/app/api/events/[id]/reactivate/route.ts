export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, event.guildId, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (event.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Only completed events can be reactivated' }, { status: 400 })
  }

  const updated = await prisma.event.update({
    where: { id: params.id },
    data: { status: 'PUBLISHED' },
  })

  // Log the action
  try {
    const { auditLog } = await import('@/lib/audit')
    await auditLog(params.id, session.user.id, 'EVENT_REACTIVATED', {
      message: `Event "${event.title}" reactivated — signups reopened`,
    })
  } catch {}

  return NextResponse.json(updated)
}
