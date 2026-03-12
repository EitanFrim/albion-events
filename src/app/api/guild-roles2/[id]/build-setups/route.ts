export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const setups = await prisma.roleBuildSetup.findMany({
    where: { roleId: params.id },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(setups)
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await prisma.guildRole2.findUnique({ where: { id: params.id } })
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, role.guildId, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, data } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  try {
    const setup = await prisma.roleBuildSetup.create({
      data: { roleId: params.id, name: name.trim(), data: data ?? {} },
    })
    return NextResponse.json(setup, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Build setup name already exists for this role' }, { status: 409 })
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await prisma.guildRole2.findUnique({ where: { id: params.id } })
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, role.guildId, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { setupId, name, data } = await req.json()
  if (!setupId) return NextResponse.json({ error: 'setupId required' }, { status: 400 })

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name.trim()
  if (data !== undefined) updateData.data = data

  try {
    const setup = await prisma.roleBuildSetup.update({
      where: { id: setupId },
      data: updateData,
    })
    return NextResponse.json(setup)
  } catch {
    return NextResponse.json({ error: 'Update failed — name may already exist' }, { status: 409 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await prisma.guildRole2.findUnique({ where: { id: params.id } })
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, role.guildId, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { setupId } = await req.json()
  if (!setupId) return NextResponse.json({ error: 'setupId required' }, { status: 400 })

  await prisma.roleBuildSetup.delete({ where: { id: setupId } })
  return NextResponse.json({ ok: true })
}
