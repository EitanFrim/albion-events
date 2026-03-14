import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ephemeralMessage, sendChannelMessage } from '@/lib/discord'
import { requireGuildAccess } from '@/lib/guild'
import { format } from 'date-fns'

interface DiscordInteraction {
  guild_id?: string
  channel_id?: string
  member?: {
    user: {
      id: string
      username: string
    }
    roles: string[]
  }
  data: {
    options?: Array<{
      name: string
      type: number
      value: string | number
    }>
  }
}

export async function handlePostEventCommand(interaction: DiscordInteraction) {
  if (!interaction.guild_id || !interaction.member) {
    return NextResponse.json(
      ephemeralMessage('This command can only be used in a Discord server.')
    )
  }

  const { guild_id: discordGuildId, channel_id: channelId } = interaction
  const invokerDiscordId = interaction.member.user.id

  // Find linked guild
  const guild = await prisma.guild.findUnique({
    where: { discordGuildId },
  })

  if (!guild) {
    return NextResponse.json(
      ephemeralMessage('This Discord server is not linked to any guild. An admin needs to run `/setup` first.')
    )
  }

  // Check invoker is OFFICER+
  const invokerUser = await prisma.user.findUnique({
    where: { discordUserId: invokerDiscordId },
  })

  if (!invokerUser) {
    return NextResponse.json(
      ephemeralMessage('You are not registered. Use `/register` first.')
    )
  }

  const invokerAccess = await requireGuildAccess(invokerUser.id, guild.id, 'OFFICER')
  if (!invokerAccess) {
    return NextResponse.json(
      ephemeralMessage('Only Officers and the Guild Owner can post events.')
    )
  }

  // Extract event ID option
  const opts: Record<string, string | number> = {}
  for (const opt of interaction.data.options ?? []) {
    opts[opt.name] = opt.value
  }

  const eventId = opts['event-id'] as string
  if (!eventId) {
    return NextResponse.json(ephemeralMessage('Event ID is required.'))
  }

  // Fetch event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      parties: {
        include: {
          roleSlots: true,
        },
      },
    },
  })

  if (!event || event.guildId !== guild.id) {
    return NextResponse.json(
      ephemeralMessage('Event not found or does not belong to this guild.')
    )
  }

  if (event.status !== 'PUBLISHED') {
    return NextResponse.json(
      ephemeralMessage(`Event is not open for signups (status: ${event.status}). Publish it first.`)
    )
  }

  // Build embed
  const totalSlots = event.parties.reduce((a, p) => a + p.roleSlots.reduce((b, s) => b + s.capacity, 0), 0)

  const fields = [
    {
      name: '📅 Date',
      value: format(new Date(event.startTime), 'EEEE, MMMM d, yyyy'),
      inline: true,
    },
    {
      name: '🕐 Time',
      value: format(new Date(event.startTime), 'HH:mm') + ' UTC',
      inline: true,
    },
    {
      name: '👥 Slots',
      value: `${totalSlots} total`,
      inline: true,
    },
  ]

  if (event.locationNote) {
    fields.push({
      name: '📍 Location',
      value: event.locationNote,
      inline: true,
    })
  }

  const embed = {
    title: `⚔️ ${event.title}`,
    description: event.description || 'Click the button below to sign up!',
    color: 0xf59e0b, // amber/accent
    fields,
    footer: {
      text: `${guild.name} • AlbionHQ`,
    },
    timestamp: new Date().toISOString(),
  }

  // Build button
  const components = [
    {
      type: 1, // ACTION_ROW
      components: [
        {
          type: 2, // BUTTON
          style: 3, // SUCCESS (green)
          label: 'Sign Up',
          custom_id: `event_signup:${event.id}`,
          emoji: { name: '✋' },
        },
      ],
    },
  ]

  // Send public message
  if (channelId) {
    await sendChannelMessage(channelId, {
      embeds: [embed],
      components,
    })
  }

  return NextResponse.json(
    ephemeralMessage(`Event **${event.title}** posted! Players can now click the Sign Up button.`)
  )
}
