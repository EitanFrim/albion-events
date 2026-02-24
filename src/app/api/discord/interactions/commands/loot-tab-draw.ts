import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ephemeralMessage, formatSilver } from '@/lib/discord'
import { requireGuildAccess } from '@/lib/guild'
import { drawWinner } from '@/lib/loot-tab-sale'

interface DiscordInteraction {
  guild_id?: string
  member?: {
    user: {
      id: string
      username: string
    }
    roles: string[]
  }
  data: Record<string, unknown>
}

export async function handleLootTabDrawCommand(interaction: DiscordInteraction) {
  if (!interaction.guild_id || !interaction.member) {
    return NextResponse.json(
      ephemeralMessage('This command can only be used in a Discord server.')
    )
  }

  const { guild_id: discordGuildId } = interaction
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
      ephemeralMessage('Only Officers and the Guild Owner can draw loot tab sales.')
    )
  }

  // Find the oldest OPEN sale for this guild
  const sale = await prisma.lootTabSale.findFirst({
    where: {
      guildId: guild.id,
      status: 'OPEN',
    },
    orderBy: { createdAt: 'asc' },
  })

  if (!sale) {
    return NextResponse.json(
      ephemeralMessage('There are no active loot tab sales to draw.')
    )
  }

  // Draw the winner
  const result = await drawWinner(sale.id)

  switch (result.status) {
    case 'drawn':
      return NextResponse.json(
        ephemeralMessage(
          `Winner drawn! **${result.winner.inGameName || result.winner.discordName}** won **${sale.description || 'the loot tab'}** for **${formatSilver(sale.price)}** silver.`
        )
      )
    case 'no_bids':
      return NextResponse.json(
        ephemeralMessage('No one signed up for the sale. It has been cancelled.')
      )
    case 'not_found':
      return NextResponse.json(
        ephemeralMessage('Sale was already drawn or cancelled.')
      )
    default:
      return NextResponse.json(
        ephemeralMessage('Something went wrong while drawing the winner.')
      )
  }
}
