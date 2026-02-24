import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ephemeralMessage, editChannelMessage } from '@/lib/discord'
import { buildSaleEmbed, buildSaleComponents } from '@/lib/loot-tab-sale'

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
    custom_id?: string
  }
}

export async function handleLootTabSignup(interaction: DiscordInteraction, customId: string) {
  if (!interaction.guild_id || !interaction.member) {
    return NextResponse.json(
      ephemeralMessage('Something went wrong.')
    )
  }

  const discordUserId = interaction.member.user.id

  // Extract sale ID from custom_id (format: "loot_tab_signup:{saleId}")
  const saleId = customId.split(':')[1]
  if (!saleId) {
    return NextResponse.json(ephemeralMessage('Invalid sale reference.'))
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { discordUserId },
  })

  if (!user) {
    return NextResponse.json(
      ephemeralMessage('You are not registered on Albion Events. Use `/register` first.')
    )
  }

  // Find the sale
  const sale = await prisma.lootTabSale.findUnique({
    where: { id: saleId },
    include: { guild: true },
  })

  if (!sale) {
    return NextResponse.json(ephemeralMessage('This sale no longer exists.'))
  }

  if (sale.status !== 'OPEN') {
    return NextResponse.json(ephemeralMessage('This sale is no longer open for signups.'))
  }

  if (new Date(sale.expiresAt) <= new Date()) {
    return NextResponse.json(ephemeralMessage('This sale has expired. The draw will happen shortly.'))
  }

  // Verify user is an ACTIVE member of the guild
  const membership = await prisma.guildMembership.findUnique({
    where: {
      userId_guildId: { userId: user.id, guildId: sale.guildId },
    },
  })

  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json(
      ephemeralMessage('You must be an active guild member to sign up. Use `/register` first.')
    )
  }

  // Check if already signed up
  const existingBid = await prisma.lootTabBid.findUnique({
    where: {
      saleId_userId: { saleId: sale.id, userId: user.id },
    },
  })

  if (existingBid) {
    return NextResponse.json(
      ephemeralMessage('You are already signed up for this sale! Good luck.')
    )
  }

  // Create the bid
  await prisma.lootTabBid.create({
    data: {
      saleId: sale.id,
      userId: user.id,
    },
  })

  // Get updated bid count and update the embed
  const bidCount = await prisma.lootTabBid.count({ where: { saleId: sale.id } })

  if (sale.channelId && sale.messageId) {
    const embed = buildSaleEmbed(sale, bidCount)
    await editChannelMessage(sale.channelId, sale.messageId, {
      embeds: [embed],
      components: [buildSaleComponents(sale.id, true)],
    })
  }

  return NextResponse.json(
    ephemeralMessage(`You're signed up for **${sale.description || 'the loot tab sale'}**! Good luck.`)
  )
}
