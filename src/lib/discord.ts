import { verifyKey } from 'discord-interactions'

export async function verifyDiscordRequest(
  rawBody: string,
  signature: string | null,
  timestamp: string | null
): Promise<boolean> {
  if (!signature || !timestamp) return false
  const publicKey = process.env.DISCORD_PUBLIC_KEY
  if (!publicKey) throw new Error('DISCORD_PUBLIC_KEY not configured')
  return verifyKey(rawBody, signature, timestamp, publicKey)
}

export function ephemeralMessage(content: string) {
  return {
    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      content,
      flags: 64, // EPHEMERAL
    },
  }
}

export function pongResponse() {
  return { type: 1 }
}

export function formatSilver(amount: number): string {
  return amount.toLocaleString('en-US')
}

export function modalResponse(customId: string, title: string, components: any[]) {
  return {
    type: 9, // MODAL
    data: {
      custom_id: customId,
      title,
      components,
    },
  }
}
