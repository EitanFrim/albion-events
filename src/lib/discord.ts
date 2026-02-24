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

// ── Discord REST API helpers (proactive messaging) ──────────────────────

const DISCORD_API_BASE = 'https://discord.com/api/v10'

export async function sendChannelMessage(
  channelId: string,
  payload: {
    content?: string
    embeds?: any[]
    components?: any[]
  }
): Promise<{ id: string } | null> {
  const res = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error(`Discord send message failed (${res.status}):`, err)
    return null
  }
  return res.json()
}

export async function editChannelMessage(
  channelId: string,
  messageId: string,
  payload: {
    content?: string
    embeds?: any[]
    components?: any[]
  }
): Promise<{ id: string } | null> {
  const res = await fetch(
    `${DISCORD_API_BASE}/channels/${channelId}/messages/${messageId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    console.error(`Discord edit message failed (${res.status}):`, err)
    return null
  }
  return res.json()
}
