import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(64).trim(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6b7280'),
  category: z.string().default('flex'),
})

// GET — public, anyone can fetch the role list
export async function GET() {
  const roles = await prisma.guildRole.findMany({
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(roles)
}

// POST — admin only, create role
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  try {
    const role = await prisma.guildRole.create({ data: parsed.data })
    return NextResponse.json(role, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Role name already exists' }, { status: 409 })
  }
}
