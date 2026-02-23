import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ephemeralMessage } from '@/lib/discord'

interface SetupInteraction {
  guild_id?: string
  member?: {
    user: { id: string }
    permissions: string
  }
  data: {
    name: string
    options?: Array<{
      name: string
      value: string
      type: number
    }>
  }
}

export async function handleSetupCommand(interaction: SetupInteraction) {
  if (!interaction.guild_id || !interaction.member) {
    return NextResponse.json(
      ephemeralMessage('This command can only be used in a Discord server.')
    )
  }

  const discordGuildId = interaction.guild_id
  const discordUserId = interaction.member.user.id
  const permissions = BigInt(interaction.member.permissions)

  // Check Discord ADMINISTRATOR permission
  const ADMINISTRATOR = BigInt(0x8)
  if ((permissions & ADMINISTRATOR) === BigInt(0)) {
    return NextResponse.json(
      ephemeralMessage('You need Administrator permission in this Discord server to run /setup.')
    )
  }

  // Find the user in our DB
  const user = await prisma.user.findUnique({
    where: { discordUserId },
  })

  if (!user) {
    return NextResponse.json(
      ephemeralMessage(
        'You need to log into Albion Events first (via Discord sign-in) before running /setup.'
      )
    )
  }

  // Find a guild the user owns
  const ownedGuild = await prisma.guild.findFirst({
    where: { ownerId: user.id },
  })

  if (!ownedGuild) {
    return NextResponse.json(
      ephemeralMessage('You do not own any guild on Albion Events.')
    )
  }

  // Check if this Discord server is already linked to a different guild
  const existingLink = await prisma.guild.findUnique({
    where: { discordGuildId },
  })
  if (existingLink && existingLink.id !== ownedGuild.id) {
    return NextResponse.json(
      ephemeralMessage(
        `This Discord server is already linked to guild "${existingLink.name}". Unlink it first from the guild settings page.`
      )
    )
  }

  // Extract the member-role, alliance-role, and server-region options
  const memberRoleOption = interaction.data.options?.find(o => o.name === 'member-role')
  const allianceRoleOption = interaction.data.options?.find(o => o.name === 'alliance-role')
  const serverRegionOption = interaction.data.options?.find(o => o.name === 'server-region')
  const memberRoleId = memberRoleOption?.value ?? null
  const allianceRoleId = allianceRoleOption?.value ?? null
  const serverRegion = serverRegionOption?.value ?? null

  const validRegions = ['americas', 'europe', 'asia']
  const regionLabels: Record<string, string> = { americas: 'Americas', europe: 'Europe', asia: 'Asia' }

  // Update the guild
  await prisma.guild.update({
    where: { id: ownedGuild.id },
    data: {
      discordGuildId,
      discordBotInstalled: true,
      ...(memberRoleId ? { discordMemberRoleId: memberRoleId } : {}),
      ...(allianceRoleId ? { discordAllianceRoleId: allianceRoleId } : {}),
      ...(serverRegion && validRegions.includes(serverRegion) ? { serverRegion } : {}),
    },
  })

  const messages: string[] = []
  if (memberRoleId) {
    messages.push(`Member role set to <@&${memberRoleId}>.`)
  }
  if (allianceRoleId) {
    messages.push(`Alliance role set to <@&${allianceRoleId}>.`)
  }
  if (serverRegion && validRegions.includes(serverRegion)) {
    messages.push(`Server region set to **${regionLabels[serverRegion] ?? serverRegion}**.`)
  }
  if (!memberRoleId && !allianceRoleId && !serverRegion) {
    messages.push('No options specified. Run `/setup member-role:@Role`, `alliance-role:@Role`, or `server-region:americas` to configure.')
  }

  return NextResponse.json(
    ephemeralMessage(`Discord server linked to **${ownedGuild.name}**! ${messages.join(' ')}`)
  )
}
