import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ephemeralMessage, formatSilver, sendChannelMessage } from '@/lib/discord'
import { requireGuildAccess } from '@/lib/guild'
import { buildSaleEmbed, buildSaleComponents } from '@/lib/loot-tab-sale'

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

export async function handleLootTabSaleCommand(interaction: DiscordInteraction) {
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
      ephemeralMessage('You are not registered on Albion Events. Use `/register` first.')
    )
  }

  const invokerAccess = await requireGuildAccess(invokerUser.id, guild.id, 'OFFICER')
  if (!invokerAccess) {
    return NextResponse.json(
      ephemeralMessage('Only Officers and the Guild Owner can create loot tab sales.')
    )
  }

  // Extract options
  const opts: Record<string, string | number> = {}
  for (const opt of interaction.data.options ?? []) {
    opts[opt.name] = opt.value
  }

  const title = (opts.title as string) || null
  const price = opts.price as number
  const duration = opts.duration as number
  const repairCost = (opts['repair-cost'] as number) ?? 0
  const silverBags = (opts['silver-bags'] as number) ?? 0

  if (!title) {
    return NextResponse.json(ephemeralMessage('Title is required.'))
  }
  if (!price || price <= 0) {
    return NextResponse.json(ephemeralMessage('Price must be a positive number.'))
  }
  if (!duration || duration <= 0) {
    return NextResponse.json(ephemeralMessage('Duration must be at least 1 hour.'))
  }

  // Create sale in DB
  const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000)
  const sale = await prisma.lootTabSale.create({
    data: {
      guildId: guild.id,
      createdById: invokerUser.id,
      price,
      durationHours: duration,
      repairCost,
      silverBags,
      description: title,
      expiresAt,
      channelId: channelId || null,
    },
  })

  // Send public embed to channel
  if (channelId) {
    const embed = buildSaleEmbed(sale, 0)
    const components = buildSaleComponents(sale.id, true)

    const msg = await sendChannelMessage(channelId, {
      embeds: [embed],
      components: [components],
    })

    // Store the message ID so we can edit it later
    if (msg?.id) {
      await prisma.lootTabSale.update({
        where: { id: sale.id },
        data: { messageId: msg.id },
      })
    }
  }

  return NextResponse.json(
    ephemeralMessage(
      `Loot tab sale created!\n**Title:** ${title}\n**Price:** ${formatSilver(price)} silver\n**Duration:** ${duration}h\n**Repair Cost:** ${formatSilver(repairCost)} silver\n**Silver Bags:** ${formatSilver(silverBags)} silver`
    )
  )
}
