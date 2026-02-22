import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

async function checkAccess(userId: string, catId: string) {
  const cat = await prisma.guildCategory.findUnique({ where: { id: catId } })
  if (!cat) return null
  const access = await requireGuildAccess(userId, cat.guildId, 'OFFICER')
  return access ? cat : null
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cat = await checkAccess(session.user.id, params.id)
  if (!cat) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  try {
    const updated = await prisma.guildCategory.update({ where: { id: params.id }, data: { name: body.name?.trim(), color: body.color } })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Not found or duplicate name' }, { status: 404 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cat = await checkAccess(session.user.id, params.id)
  if (!cat) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.guildCategory.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
