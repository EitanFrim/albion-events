import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

async function checkAccess(userId: string, tplId: string) {
  const tpl = await prisma.guildTemplate.findUnique({ where: { id: tplId } })
  if (!tpl) return null
  const access = await requireGuildAccess(userId, tpl.guildId, 'OFFICER')
  return access ? tpl : null
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tpl = await checkAccess(session.user.id, params.id)
  if (!tpl) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })
  const { name, data } = await req.json()
  try {
    const updated = await prisma.guildTemplate.update({ where: { id: params.id }, data: { name: name?.trim(), data } })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Not found or duplicate name' }, { status: 404 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tpl = await checkAccess(session.user.id, params.id)
  if (!tpl) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })
  await prisma.guildTemplate.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
