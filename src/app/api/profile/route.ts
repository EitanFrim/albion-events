export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyAlbionName } from '@/lib/albion'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { inGameName: true, discordName: true },
  })

  return NextResponse.json({ inGameName: user?.inGameName ?? null, discordName: user?.discordName })
}

const schema = z.object({
  inGameName: z.string().min(1).max(64).trim(),
  guildSlug: z.string().optional(),
})

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Name must be 1–64 characters' }, { status: 400 })
  }

  let finalName = parsed.data.inGameName

  // Verify against Albion Online API if guild has a server region configured
  if (parsed.data.guildSlug) {
    const guild = await prisma.guild.findUnique({
      where: { slug: parsed.data.guildSlug },
      select: { serverRegion: true },
    })

    if (guild?.serverRegion) {
      const result = await verifyAlbionName(finalName, guild.serverRegion)
      if (!result.valid) {
        return NextResponse.json(
          { error: `Player "${finalName}" not found in Albion Online. Check the spelling and make sure you're on the correct server region.` },
          { status: 400 }
        )
      }
      // Use the exact casing from the API
      if (result.exactName) finalName = result.exactName
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { inGameName: finalName },
  })

  return NextResponse.json({ inGameName: user.inGameName })
}
