export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyDiscordRequest, ephemeralMessage, pongResponse } from '@/lib/discord'
import { handleRegisterCommand } from './commands/register'
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

  return NextResponse.json(ephemeralMessage('Interaction not supported'))
}
