import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ephemeralMessage, modalResponse } from '@/lib/discord'

interface DiscordInteraction {
  guild_id?: string
  member?: {
    user: {
      id: string
      username: string
      avatar: string | null
    }
    roles: string[]
  }
}

export async function handleRegisterCommand(interaction: DiscordInteraction) {
  if (!interaction.guild_id || !interaction.member) {
    return NextResponse.json(
      ephemeralMessage('This command can only be used in a Discord server.')
    )
  }

  const { guild_id: discordGuildId } = interaction
  const { user: discordUser, roles: memberRoles } = interaction.member

  // Find linked guild
  const guild = await prisma.guild.findUnique({
    where: { discordGuildId },
  })

  if (!guild) {
    return NextResponse.json(
      ephemeralMessage(
        'This Discord server is not linked to any guild. An admin needs to run `/setup` first.'
      )
    )
  }

  if (!guild.discordMemberRoleId && !guild.discordAllianceRoleId) {
    return NextResponse.json(
      ephemeralMessage(
        'The bot is not fully configured. An admin needs to set a member role with `/setup`.'
      )
    )
  }

  // Determine which role to assign based on Discord roles
  const hasMemberRole = guild.discordMemberRoleId ? memberRoles.includes(guild.discordMemberRoleId) : false
  const hasAllianceRole = guild.discordAllianceRoleId ? memberRoles.includes(guild.discordAllianceRoleId) : false

  if (!hasMemberRole && !hasAllianceRole) {
    return NextResponse.json(
      ephemeralMessage(
        'You do not have the required Discord role to register. Contact a guild officer to get the member role.'
      )
    )
  }

  // Member role takes priority over alliance role
  const assignedRole: 'PLAYER' | 'ALLIANCE' = hasMemberRole ? 'PLAYER' : 'ALLIANCE'

  // Find or create User
  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null

  const user = await prisma.user.upsert({
    where: { discordUserId: discordUser.id },
    update: {
      discordName: discordUser.username,
      avatarUrl,
    },
    create: {
      discordUserId: discordUser.id,
      discordName: discordUser.username,
      avatarUrl,
      role: 'PLAYER',
    },
  })

  // Check existing membership
  const existing = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: user.id, guildId: guild.id } },
  })

  if (existing) {
    if (existing.status === 'ACTIVE') {
      return NextResponse.json(
        ephemeralMessage(`You are already a verified member of **${guild.name}**!`)
      )
    }
    if (existing.status === 'SUSPENDED') {
      return NextResponse.json(
        ephemeralMessage('Your membership has been suspended. Contact a guild officer.')
      )
    }
  }

  // If user has no in-game name, show modal to collect it first
  // Encode the assigned role in the modal custom_id so we know it on submit
  if (!user.inGameName) {
    return NextResponse.json(
      modalResponse(`register_ign_modal:${assignedRole}`, 'Set Your In-Game Name', [
        {
          type: 1, // ACTION_ROW
          components: [
            {
              type: 4, // TEXT_INPUT
              custom_id: 'ign_input',
              label: 'Your Albion Online in-game name',
              style: 1, // SHORT
              min_length: 2,
              max_length: 32,
              required: true,
              placeholder: 'e.g. SilverKnight',
            },
          ],
        },
      ])
    )
  }

  // Complete registration
  return completeRegistration(user.id, guild.id, guild.name, !!existing, assignedRole)
}

export async function completeRegistration(
  userId: string,
  guildId: string,
  guildName: string,
  hasPendingMembership: boolean,
  memberRole: 'PLAYER' | 'ALLIANCE' = 'PLAYER'
) {
  if (hasPendingMembership) {
    // PENDING → upgrade to ACTIVE with the correct role
    await prisma.guildMembership.update({
      where: { userId_guildId: { userId, guildId } },
      data: {
        role: memberRole,
        status: 'ACTIVE',
        verifiedAt: new Date(),
      },
    })
  } else {
    // Create new ACTIVE membership
    await prisma.guildMembership.create({
      data: {
        userId,
        guildId,
        role: memberRole,
        status: 'ACTIVE',
        verifiedAt: new Date(),
      },
    })
  }

  return NextResponse.json(
    ephemeralMessage(
      `Welcome to **${guildName}**! You have been registered as a verified member.`
    )
  )
}
