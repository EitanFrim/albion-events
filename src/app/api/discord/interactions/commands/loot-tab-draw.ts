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
  data: {
    options?: Array<{
      name: string
      type: number
      value: string | number
      focused?: boolean
    }>
  }
}

// ── Autocomplete: return list of active sales ────────────────────────────

export async function handleLootTabDrawAutocomplete(interaction: DiscordInteraction) {
  const discordGuildId = interaction.guild_id
  if (!discordGuildId) {
    return NextResponse.json({ type: 8, data: { choices: [] } })
  }

  const guild = await prisma.guild.findUnique({ where: { discordGuildId } })
  if (!guild) {
    return NextResponse.json({ type: 8, data: { choices: [] } })
  }

  // Get the current typed value for filtering
  const focused = interaction.data.options?.find(o => o.focused)
  const query = (focused?.value as string || '').toLowerCase()

  const openSales = await prisma.lootTabSale.findMany({
    where: { guildId: guild.id, status: 'OPEN' },
    include: { _count: { select: { bids: true } } },
    orderBy: { createdAt: 'desc' },
    take: 25,
  })

  const choices = openSales
    .filter(s => !query || (s.description || '').toLowerCase().includes(query))
    .slice(0, 25)
    .map(s => ({
      name: `${s.description || 'Untitled'} — ${formatSilver(s.price)} silver (${s._count.bids} signups)`,
      value: s.id,
    }))

  return NextResponse.json({ type: 8, data: { choices } })
}

// ── Command: draw a specific sale ────────────────────────────────────────

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

  // Get the selected sale ID from the autocomplete option
  const saleId = interaction.data.options?.find(o => o.name === 'sale')?.value as string

  if (!saleId) {
    return NextResponse.json(
      ephemeralMessage('Please select a sale to draw.')
    )
  }

  // Verify sale belongs to this guild
  const sale = await prisma.lootTabSale.findFirst({
    where: { id: saleId, guildId: guild.id, status: 'OPEN' },
  })

  if (!sale) {
    return NextResponse.json(
      ephemeralMessage('Sale not found or already drawn. Use the autocomplete to pick an active sale.')
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
        ephemeralMessage(`No one signed up for **${sale.description || 'the sale'}**. It has been cancelled.`)
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
