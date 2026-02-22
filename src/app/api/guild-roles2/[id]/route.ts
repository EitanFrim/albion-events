export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

async function checkAccess(userId: string, roleId: string) {
  const role = await prisma.guildRole2.findUnique({ where: { id: roleId } })
  if (!role) return null
  const access = await requireGuildAccess(userId, role.guildId, 'OFFICER')
  return access ? role : null
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = await checkAccess(session.user.id, params.id)
  if (!role) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })
  const body = await req.json()
  try {
    const updated = await prisma.guildRole2.update({
      where: { id: params.id },
      data: { name: body.name?.trim(), categoryId: body.categoryId ?? null },
      include: { category: true },
    })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Not found or duplicate name' }, { status: 404 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = await checkAccess(session.user.id, params.id)
  if (!role) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })
  await prisma.guildRole2.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
