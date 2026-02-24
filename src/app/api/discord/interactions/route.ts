export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyDiscordRequest, ephemeralMessage, pongResponse } from '@/lib/discord'
import { handleRegisterCommand, completeRegistration } from './commands/register'
import { handleSetupCommand } from './commands/setup'
import { handleVerifyMessageCommand } from './commands/verify-message'
import { handleBalCommand } from './commands/bal'
import { handleBalanceCommand } from './commands/balance'
import { handleLootTabSaleCommand } from './commands/loot-tab-sale'
import { handleLootTabDrawCommand } from './commands/loot-tab-draw'
import { handleLootTabSignup } from './commands/loot-tab-signup'

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
      case 'loot-tab-sale':
        return handleLootTabSaleCommand(interaction)
      case 'loot-tab-draw':
        return handleLootTabDrawCommand(interaction)
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

    if (customId.startsWith('loot_tab_signup:')) {
      return handleLootTabSignup(interaction, customId)
    }

    return NextResponse.json(ephemeralMessage('Unknown button interaction'))
  }

  // MODAL_SUBMIT
  if (interaction.type === 5) {
    const customId: string = interaction.data.custom_id

    if (customId.startsWith('register_ign_modal')) {
      return handleIgnModalSubmit(interaction)
    }

    return NextResponse.json(ephemeralMessage('Unknown modal submission'))
  }

  return NextResponse.json(ephemeralMessage('Interaction not supported'))
}

async function handleIgnModalSubmit(interaction: any) {
  const { prisma } = await import('@/lib/prisma')
  const { verifyAlbionName, REGION_LABELS } = await import('@/lib/albion')

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

  // Extract the assigned role from the modal custom_id (e.g. "register_ign_modal:ALLIANCE")
  const customId: string = interaction.data.custom_id ?? ''
  const rolePart = customId.split(':')[1]
  const assignedRole: 'PLAYER' | 'ALLIANCE' = rolePart === 'ALLIANCE' ? 'ALLIANCE' : 'PLAYER'

  // Find guild and user
  const guild = await prisma.guild.findUnique({ where: { discordGuildId } })
  if (!guild) {
    return NextResponse.json(ephemeralMessage('Guild not found.'))
  }

  const user = await prisma.user.findUnique({ where: { discordUserId: discordUser.id } })
  if (!user) {
    return NextResponse.json(ephemeralMessage('User not found. Try registering again.'))
  }

  // Verify the in-game name against Albion Online API
  let finalName = ignInput
  if (guild.serverRegion) {
    const result = await verifyAlbionName(ignInput, guild.serverRegion)
    if (!result.valid) {
      const regionLabel = REGION_LABELS[guild.serverRegion] ?? guild.serverRegion
      return NextResponse.json(
        ephemeralMessage(`Player **"${ignInput}"** not found in Albion Online (${regionLabel} server). Check the spelling and make sure you're on the correct server region.`)
      )
    }
    if (result.exactName) finalName = result.exactName
  }

  // Save the in-game name
  await prisma.user.update({
    where: { id: user.id },
    data: { inGameName: finalName },
  })

  // Check if they already have a pending membership
  const existing = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: user.id, guildId: guild.id } },
  })

  return completeRegistration(user.id, guild.id, guild.name, !!existing, assignedRole)
}
