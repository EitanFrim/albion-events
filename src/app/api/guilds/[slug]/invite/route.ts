import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess, generateInviteCode } from '@/lib/guild'

export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, guild.id, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let newCode = generateInviteCode()
  while (await prisma.guild.findUnique({ where: { inviteCode: newCode } })) {
    newCode = generateInviteCode()
  }

  const updated = await prisma.guild.update({
    where: { id: guild.id },
    data: { inviteCode: newCode },
  })

  return NextResponse.json({ inviteCode: updated.inviteCode })
}
