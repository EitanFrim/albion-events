import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']).optional(),
  role: z.enum(['ADMIN', 'OFFICER', 'PLAYER']).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.role === 'ADMIN'
  const isOfficer = session.user.role === 'OFFICER'

  if (!isAdmin && !isOfficer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const { status, role } = parsed.data

  // Officers can only verify/suspend players, not change roles
  if (role && !isAdmin) {
    return NextResponse.json({ error: 'Only admins can change roles' }, { status: 403 })
  }

  // Prevent demoting another admin (admin-only protection)
  if (role && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.userId } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Officers cannot modify admins
  if (isOfficer && target.role === 'ADMIN') {
    return NextResponse.json({ error: 'Cannot modify an admin' }, { status: 403 })
  }

  const updateData: any = {}
  if (status) {
    updateData.status = status
    if (status === 'ACTIVE') {
      updateData.verifiedById = session.user.id
      updateData.verifiedAt = new Date()
    }
  }
  if (role) updateData.role = role

  const updated = await prisma.user.update({
    where: { id: params.userId },
    data: updateData,
    select: {
      id: true, discordName: true, inGameName: true,
      role: true, status: true, verifiedAt: true,
    },
  })

  return NextResponse.json(updated)
}
