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

  if (event.status !== 'PUBLISHED') {
    return NextResponse.json(ephemeralMessage('This event is no longer open for signups.'))
  }

  // Check if user already has an active signup
  const existingUser = await prisma.user.findUnique({
    where: { discordUserId: discordUser.id },
  })

  if (existingUser) {
    const existingSignup = await prisma.signup.findUnique({
      where: { eventId_userId: { eventId, userId: existingUser.id } },
    })

    if (existingSignup && existingSignup.status === 'ACTIVE') {
      return NextResponse.json(
        ephemeralMessage('You are already signed up for this event! You can manage your signup on the web app.')
      )
    }
  }

  // Generate token
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.eventSignupToken.create({
    data: {
      token,
      eventId,
      discordUserId: discordUser.id,
      discordUsername: discordUser.global_name || discordUser.username,
      expiresAt,
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL || 'https://albionhq.com'
  const signupUrl = `${baseUrl}/events/${eventId}/signup/${token}`

  return NextResponse.json(
    ephemeralMessage(
      `🔗 **Your private signup link:**\n${signupUrl}\n\n` +
      `This link is unique to you and expires in 24 hours.\n` +
      `No login required — just click and choose your roles!`
    )
  )
}
