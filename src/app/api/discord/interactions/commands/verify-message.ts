import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ephemeralMessage } from '@/lib/discord'

interface VerifyMessageInteraction {
  guild_id?: string
  member?: {
    user: { id: string }
    permissions: string
  }
}

export async function handleVerifyMessageCommand(interaction: VerifyMessageInteraction) {
  if (!interaction.guild_id || !interaction.member) {
    return NextResponse.json(
      ephemeralMessage('This command can only be used in a Discord server.')
    )
  }

  const permissions = BigInt(interaction.member.permissions)
  const ADMINISTRATOR = BigInt(0x8)
  if ((permissions & ADMINISTRATOR) === BigInt(0)) {
    return NextResponse.json(
      ephemeralMessage('You need Administrator permission to use this command.')
    )
  }

  // Find the linked guild
  const guild = await prisma.guild.findUnique({
    where: { discordGuildId: interaction.guild_id },
  })

  const guildName = guild?.name ?? 'Albion Events'

  // Respond with a public message containing an embed + button
  return NextResponse.json({
    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      embeds: [
        {
          title: `${guildName} — Member Registration`,
          description:
            'Click the button below to register as a verified guild member.\n\n' +
            'You must have the required Discord role to register.',
          color: 0xf97316, // orange accent matching the app
        },
      ],
      components: [
        {
          type: 1, // ACTION_ROW
          components: [
            {
              type: 2, // BUTTON
              style: 3, // SUCCESS (green)
              label: 'Register',
              custom_id: 'register_button',
              emoji: { name: '✅' },
            },
          ],
        },
      ],
    },
  })
}
