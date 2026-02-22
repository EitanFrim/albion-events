import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

async function checkOfficerForRole(userId: string, roleId: string) {
  const role = await prisma.guildRole2.findUnique({ where: { id: roleId } })
  if (!role) return null
  const access = await requireGuildAccess(userId, role.guildId, 'OFFICER')
  return access ? role : null
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = await checkOfficerForRole(session.user.id, params.id)
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const specs = await prisma.playerRoleSpec.findMany({
    where: { roleId: params.id },
    include: { user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(specs)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = await checkOfficerForRole(session.user.id, params.id)
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { userId } = await req.json()
  try {
    const spec = await prisma.playerRoleSpec.create({
      data: { userId, roleId: params.id },
      include: { user: { select: { id: true, discordName: true, inGameName: true, avatarUrl: true } } },
    })
    return NextResponse.json(spec, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Already a specialist' }, { status: 409 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = await checkOfficerForRole(session.user.id, params.id)
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  await prisma.playerRoleSpec.deleteMany({ where: { userId, roleId: params.id } })
  return NextResponse.json({ ok: true })
}
