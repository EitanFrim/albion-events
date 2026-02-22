export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug, generateInviteCode } from '@/lib/guild'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(64).trim(),
  description: z.string().max(280).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const { name, description } = parsed.data

  // One guild per user — check if they already own one
  const existingOwned = await prisma.guild.findFirst({ where: { ownerId: session.user.id } })
  if (existingOwned) {
    return NextResponse.json({ error: 'You already own a guild. Each account can only create one guild.' }, { status: 400 })
  }

  // Generate unique slug
  let slug = generateSlug(name)
  if (!slug) return NextResponse.json({ error: 'Invalid guild name' }, { status: 400 })

  // Ensure slug uniqueness by appending a number if needed
  const existing = await prisma.guild.findUnique({ where: { slug } })
  if (existing) {
    slug = `${slug}-${Math.floor(Math.random() * 9000) + 1000}`
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode()
  while (await prisma.guild.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode()
  }

  const guild = await prisma.guild.create({
    data: {
      name,
      slug,
      description,
      inviteCode,
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: 'OWNER',
          status: 'ACTIVE',
          verifiedAt: new Date(),
        },
      },
    },
  })

  return NextResponse.json(guild, { status: 201 })
}
