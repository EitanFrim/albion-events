import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ephemeralMessage } from '@/lib/discord'
import { randomUUID } from 'crypto'

interface DiscordInteraction {
  guild_id?: string
  member?: {
    user: {
      id: string
      username: string
      global_name?: string
    }
  }
  data: {
    custom_id: string
  }
}

export async function handleEventSignupButton(interaction: DiscordInteraction, customId: string) {
  const eventId = customId.replace('event_signup:', '')
  const discordUser = interaction.member?.user

  if (!discordUser) {
    return NextResponse.json(ephemeralMessage('Something went wrong.'))
  }

  // Find the event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { guild: { select: { slug: true } } },
  })

  if (!event) {
    return NextResponse.json(ephemeralMessage('Event not found.'))
  }

  if (event.status !== 'PUBLISHED' && event.status !== 'LOCKED' && event.status !== 'COMPLETED') {
    return NextResponse.json(ephemeralMessage('This event is not available.'))
  }

  // Upsert token — reuse existing link for same user+event, or create new one
  const discordUsername = discordUser.global_name || discordUser.username
  const existingToken = await prisma.eventSignupToken.findUnique({
    where: { event_discord_user: { eventId, discordUserId: discordUser.id } },
  })

  let tokenValue: string
  if (existingToken) {
    tokenValue = existingToken.token
    // Update username in case it changed
    await prisma.eventSignupToken.update({
      where: { id: existingToken.id },
      data: { discordUsername },
    })
  } else {
    tokenValue = randomUUID()
    await prisma.eventSignupToken.create({
      data: {
        token: tokenValue,
        eventId,
        discordUserId: discordUser.id,
        discordUsername,
        // No expiration — permanent link
      },
    })
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://albionhq.com'
  const signupUrl = `${baseUrl}/events/${eventId}/signup/${tokenValue}`

  return NextResponse.json(
    ephemeralMessage(
      `🔗 **Your event link:**\n${signupUrl}\n\n` +
      `This link is your personal event page — sign up, manage your signup, and request regears all from here.\n` +
      `Bookmark it for easy access!`
    )
  )
}
