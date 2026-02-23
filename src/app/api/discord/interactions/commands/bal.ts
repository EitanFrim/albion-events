import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ephemeralMessage, formatSilver } from '@/lib/discord'

interface DiscordInteraction {
  guild_id?: string
  member?: {
    user: {
      id: string
      username: string
    }
  }
}

export async function handleBalCommand(interaction: DiscordInteraction) {
  if (!interaction.guild_id || !interaction.member) {
    return NextResponse.json(
      ephemeralMessage('This command can only be used in a Discord server.')
    )
  }

  const { guild_id: discordGuildId } = interaction
  const discordUserId = interaction.member.user.id

  // Find linked guild
  const guild = await prisma.guild.findUnique({
    where: { discordGuildId },
  })

  if (!guild) {
    return NextResponse.json(
      ephemeralMessage('This Discord server is not linked to any guild. An admin needs to run `/setup` first.')
    )
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { discordUserId },
  })

  if (!user) {
    return NextResponse.json(
      ephemeralMessage('You are not registered. Use `/register` or click the Register button first.')
    )
  }

  // Find membership
  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: user.id, guildId: guild.id } },
  })

  if (!membership) {
    return NextResponse.json(
      ephemeralMessage('You are not a member of this guild. Use `/register` first.')
    )
  }

  return NextResponse.json(
    ephemeralMessage(
      `Your balance in **${guild.name}**: **${formatSilver(membership.balance)}** silver`
    )
  )
}
