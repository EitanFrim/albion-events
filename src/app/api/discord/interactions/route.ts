export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyDiscordRequest, ephemeralMessage, pongResponse } from '@/lib/discord'
import { handleRegisterCommand, completeRegistration } from './commands/register'
import { handleSetupCommand } from './commands/setup'
import { handleVerifyMessageCommand } from './commands/verify-message'
import { handleBalCommand } from './commands/bal'
import { handleBalanceCommand } from './commands/balance'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('X-Signature-Ed25519')
  const timestamp = req.headers.get('X-Signature-Timestamp')

  const isValid = await verifyDiscordRequest(rawBody, signature, timestamp)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const interaction = JSON.parse(rawBody)

  // PING — Discord endpoint validation
  if (interaction.type === 1) {
    return NextResponse.json(pongResponse())
  }

  // APPLICATION_COMMAND
  if (interaction.type === 2) {
    const commandName = interaction.data.name

    switch (commandName) {
      case 'register':
        return handleRegisterCommand(interaction)
      case 'setup':
        return handleSetupCommand(interaction)
      case 'verify-message':
        return handleVerifyMessageCommand(interaction)
      case 'bal':
        return handleBalCommand(interaction)
      case 'balance':
        return handleBalanceCommand(interaction)
      default:
        return NextResponse.json(ephemeralMessage(`Unknown command: ${commandName}`))
    }
  }

  // MESSAGE_COMPONENT (button clicks)
  if (interaction.type === 3) {
    const customId = interaction.data.custom_id

    if (customId === 'register_button') {
      return handleRegisterCommand(interaction)
    }

    return NextResponse.json(ephemeralMessage('Unknown button interaction'))
  }

  // MODAL_SUBMIT
  if (interaction.type === 5) {
    const customId = interaction.data.custom_id

    if (customId === 'register_ign_modal') {
      return handleIgnModalSubmit(interaction)
    }

    return NextResponse.json(ephemeralMessage('Unknown modal submission'))
  }

  return NextResponse.json(ephemeralMessage('Interaction not supported'))
}

async function handleIgnModalSubmit(interaction: any) {
  const { prisma } = await import('@/lib/prisma')

  const discordGuildId = interaction.guild_id
  const discordUser = interaction.member?.user
  if (!discordGuildId || !discordUser) {
    return NextResponse.json(ephemeralMessage('Something went wrong.'))
  }

  // Get the in-game name from the modal input
  const ignInput = interaction.data.components?.[0]?.components?.[0]?.value?.trim()
  if (!ignInput) {
    return NextResponse.json(ephemeralMessage('Please provide a valid in-game name.'))
  }

  // Find guild and user
  const guild = await prisma.guild.findUnique({ where: { discordGuildId } })
  if (!guild) {
    return NextResponse.json(ephemeralMessage('Guild not found.'))
  }

  const user = await prisma.user.findUnique({ where: { discordUserId: discordUser.id } })
  if (!user) {
    return NextResponse.json(ephemeralMessage('User not found. Try registering again.'))
  }

  // Save the in-game name
  await prisma.user.update({
    where: { id: user.id },
    data: { inGameName: ignInput },
  })

  // Check if they already have a pending membership
  const existing = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: user.id, guildId: guild.id } },
  })

  return completeRegistration(user.id, guild.id, guild.name, !!existing)
}
