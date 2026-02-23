import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ephemeralMessage, formatSilver } from '@/lib/discord'
import { requireGuildAccess } from '@/lib/guild'
import { adjustBalance } from '@/lib/balance'

interface DiscordInteraction {
  guild_id?: string
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
      options?: Array<{
        name: string
        type: number
        value: string | number
      }>
    }>
  }
}

function getSubcommand(interaction: DiscordInteraction) {
  const sub = interaction.data.options?.[0]
  if (!sub) return null

  const opts: Record<string, string | number> = {}
  for (const opt of sub.options ?? []) {
    opts[opt.name] = opt.value
  }

  return { name: sub.name, opts }
}

export async function handleBalanceCommand(interaction: DiscordInteraction) {
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

  // Check invoker is OFFICER+ in the guild
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
      ephemeralMessage('Only Officers and the Guild Owner can use this command.')
    )
  }

  // Parse subcommand
  const sub = getSubcommand(interaction)
  if (!sub) {
    return NextResponse.json(
      ephemeralMessage('Please use a subcommand: `/balance add`, `/balance deduct`, or `/balance check`.')
    )
  }

  // Resolve target player
  const targetDiscordId = sub.opts.player as string
  if (!targetDiscordId) {
    return NextResponse.json(ephemeralMessage('Please specify a player.'))
  }

  const targetUser = await prisma.user.findUnique({
    where: { discordUserId: targetDiscordId },
  })

  if (!targetUser) {
    return NextResponse.json(
      ephemeralMessage('That player is not registered on Albion Events.')
    )
  }

  const targetMembership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: targetUser.id, guildId: guild.id } },
  })

  if (!targetMembership) {
    return NextResponse.json(
      ephemeralMessage('That player is not a member of this guild.')
    )
  }

  // Handle subcommands
  if (sub.name === 'check') {
    return NextResponse.json(
      ephemeralMessage(
        `**${targetUser.discordName}**'s balance: **${formatSilver(targetMembership.balance)}** silver`
      )
    )
  }

  if (sub.name === 'add' || sub.name === 'deduct') {
    const rawAmount = sub.opts.amount as number
    if (!rawAmount || rawAmount <= 0) {
      return NextResponse.json(ephemeralMessage('Amount must be a positive number.'))
    }

    const amount = sub.name === 'deduct' ? -rawAmount : rawAmount
    const reason = sub.opts.reason as string | undefined

    const result = await adjustBalance({
      membershipId: targetMembership.id,
      amount,
      reason,
      performedById: invokerUser.id,
    })

    const action = sub.name === 'add' ? 'Added' : 'Deducted'
    return NextResponse.json(
      ephemeralMessage(
        `${action} **${formatSilver(rawAmount)}** silver ${sub.name === 'add' ? 'to' : 'from'} **${targetUser.discordName}**'s balance.\nNew balance: **${formatSilver(result.newBalance)}** silver`
      )
    )
  }

  return NextResponse.json(
    ephemeralMessage('Unknown subcommand. Use `/balance add`, `/balance deduct`, or `/balance check`.')
  )
}
