export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGuildAccess } from '@/lib/guild'
import { sendChannelMessage } from '@/lib/discord'
import { format } from 'date-fns'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { channelId } = body
  if (!channelId || typeof channelId !== 'string') {
    return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      guild: { select: { id: true, name: true } },
      parties: {
        include: { roleSlots: true },
      },
    },
  })

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const access = await requireGuildAccess(session.user.id, event.guildId, 'OFFICER')
  if (!access) return NextResponse.json({ error: 'Officer access required' }, { status: 403 })

  if (event.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Event must be published first' }, { status: 400 })
  }

  const totalSlots = event.parties.reduce((a, p) => a + p.roleSlots.reduce((b, s) => b + s.capacity, 0), 0)

  const fields = [
    { name: '📅 Date', value: format(new Date(event.startTime), 'EEEE, MMMM d, yyyy'), inline: true },
    { name: '🕐 Time', value: format(new Date(event.startTime), 'HH:mm') + ' UTC', inline: true },
    { name: '👥 Slots', value: `${totalSlots} total`, inline: true },
  ]

  if (event.locationNote) {
    fields.push({ name: '📍 Location', value: event.locationNote, inline: true })
  }

  const embed = {
    title: `⚔️ ${event.title}`,
    description: event.description || 'Click the button below to sign up!',
    color: 0xf59e0b,
    fields,
    footer: { text: `${event.guild.name} • AlbionHQ` },
    timestamp: new Date().toISOString(),
  }

  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: 'Sign Up',
          custom_id: `event_signup:${event.id}`,
          emoji: { name: '✋' },
        },
      ],
    },
  ]

  const msg = await sendChannelMessage(channelId, { embeds: [embed], components })

  if (!msg) {
    return NextResponse.json({ error: 'Failed to send message. Check bot permissions in that channel.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, messageId: msg.id })
}
