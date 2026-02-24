/**
 * Discord Gateway Bot — handles `!tag` prefix command for tagging players to loot tab sales.
 *
 * Usage:
 *   npx tsx scripts/discord-bot.ts
 *   npm run discord:bot
 *
 * Requires DISCORD_BOT_TOKEN and DATABASE_URL in .env
 *
 * IMPORTANT: Enable the "Message Content Intent" in Discord Developer Portal:
 *   Bot settings > Privileged Gateway Intents > Message Content Intent
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js'
import type { Message, StringSelectMenuInteraction } from 'discord.js'

// ── Load .env ─────────────────────────────────────────────────────────────
const envPath = resolve(__dirname, '..', '.env')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
} catch { /* .env file is optional if vars are already set */ }

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
if (!DISCORD_BOT_TOKEN) {
  console.error('Missing DISCORD_BOT_TOKEN in .env')
  process.exit(1)
}

// ── Prisma (lazy import to ensure env is loaded first) ────────────────────
let _prisma: any = null
async function getPrisma() {
  if (!_prisma) {
    const { PrismaClient } = await import('@prisma/client')
    _prisma = new PrismaClient()
  }
  return _prisma
}

// ── Role hierarchy helper ─────────────────────────────────────────────────
const ROLE_RANK: Record<string, number> = { ALLIANCE: 0, PLAYER: 0, OFFICER: 1, OWNER: 2 }

function hasMinRole(role: string, minRole: string): boolean {
  return (ROLE_RANK[role] ?? -1) >= (ROLE_RANK[minRole] ?? 0)
}

// ── Format silver ─────────────────────────────────────────────────────────
function formatSilver(amount: number): string {
  return amount.toLocaleString('en-US')
}

// ── Client setup ──────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

client.once('ready', () => {
  console.log(`Discord bot connected as ${client.user?.tag}`)
})

// ── !tag command handler ──────────────────────────────────────────────────
client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return
  if (!message.guild) return

  const content = message.content.trim()
  if (!content.toLowerCase().startsWith('!tag')) return

  const prisma = await getPrisma()

  try {
    // Find linked guild
    const guild = await prisma.guild.findUnique({
      where: { discordGuildId: message.guild.id },
    })

    if (!guild) {
      await message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xef4444)
          .setDescription('This Discord server is not linked to any guild on Albion Events.')
        ],
      })
      return
    }

    // Check if the user is an OFFICER+
    const user = await prisma.user.findUnique({
      where: { discordUserId: message.author.id },
    })

    if (!user) {
      await message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xef4444)
          .setDescription('You are not registered on Albion Events. Use `/register` first.')
        ],
      })
      return
    }

    const membership = await prisma.guildMembership.findUnique({
      where: { userId_guildId: { userId: user.id, guildId: guild.id } },
    })

    if (!membership || membership.status !== 'ACTIVE' || !hasMinRole(membership.role, 'OFFICER')) {
      await message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xef4444)
          .setDescription('Only Officers and the Guild Owner can use the `!tag` command.')
        ],
      })
      return
    }

    // Parse player names from the message (everything after "!tag")
    const rawNames = content.slice(4).trim()
    if (!rawNames) {
      await message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xf97316)
          .setTitle('Usage: !tag')
          .setDescription('`!tag PlayerName1, PlayerName2, PlayerName3`\n\nSeparate player names with commas or spaces. Names are matched against in-game names in the guild.')
        ],
      })
      return
    }

    // Split by comma first, then by whitespace for each segment
    const playerNames = rawNames
      .split(/[,\n]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0)

    if (playerNames.length === 0) {
      await message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xef4444)
          .setDescription('No player names provided. Usage: `!tag Player1, Player2, Player3`')
        ],
      })
      return
    }

    // Look up players by in-game name (case-insensitive)
    const allMembers = await prisma.guildMembership.findMany({
      where: { guildId: guild.id, status: 'ACTIVE' },
      include: { user: { select: { id: true, discordName: true, inGameName: true } } },
    })

    const nameMap = new Map<string, { userId: string; displayName: string }>()
    for (const m of allMembers) {
      if (m.user.inGameName) {
        nameMap.set(m.user.inGameName.toLowerCase(), {
          userId: m.user.id,
          displayName: m.user.inGameName,
        })
      }
    }

    const found: Array<{ userId: string; displayName: string }> = []
    const notFound: string[] = []

    for (const name of playerNames) {
      const match = nameMap.get(name.toLowerCase())
      if (match) {
        // Avoid duplicates in the found list
        if (!found.some(f => f.userId === match.userId)) {
          found.push(match)
        }
      } else {
        notFound.push(name)
      }
    }

    if (found.length === 0) {
      await message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle('No players found')
          .setDescription(`None of the provided names matched any registered guild members.\n\n**Not found:** ${notFound.join(', ')}`)
        ],
      })
      return
    }

    // Find eligible sales (DRAWN, not yet split)
    const eligibleSales = await prisma.lootTabSale.findMany({
      where: {
        guildId: guild.id,
        status: 'DRAWN',
        splitCompleted: false,
      },
      orderBy: { drawnAt: 'desc' },
      take: 25,
    })

    if (eligibleSales.length === 0) {
      await message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xef4444)
          .setDescription('No eligible loot tab sales found. A sale must be drawn (winner selected) and not yet split.')
        ],
      })
      return
    }

    // Auto-select if only one eligible sale, otherwise show select menu
    if (eligibleSales.length === 1) {
      await tagPlayersToSale(message, prisma, eligibleSales[0], found, notFound, user.id)
    } else {
      // Send a select menu for the officer to pick which sale
      const options = eligibleSales.slice(0, 25).map((s: any) => ({
        label: (s.description || 'Untitled Sale').slice(0, 100),
        description: `${formatSilver(s.price)} silver — drawn ${new Date(s.drawnAt).toLocaleDateString()}`,
        value: s.id,
      }))

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`tag_sale_select:${message.id}`)
        .setPlaceholder('Select a loot tab sale...')
        .addOptions(options)

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)

      const reply = await message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xf97316)
          .setTitle('Multiple eligible sales')
          .setDescription(`Found **${found.length}** player(s). Select which sale to tag them to:`)
        ],
        components: [row],
      })

      // Wait for the selection (60 second timeout)
      try {
        const interaction = await reply.awaitMessageComponent({
          filter: (i) => i.user.id === message.author.id && i.customId === `tag_sale_select:${message.id}`,
          time: 60_000,
        }) as StringSelectMenuInteraction

        const selectedSaleId = interaction.values[0]
        const selectedSale = eligibleSales.find((s: any) => s.id === selectedSaleId)

        if (selectedSale) {
          await interaction.deferUpdate()
          await tagPlayersToSale(message, prisma, selectedSale, found, notFound, user.id)
          // Remove the select menu
          await reply.edit({ components: [] })
        }
      } catch {
        // Timeout — remove the select menu
        await reply.edit({
          embeds: [new EmbedBuilder()
            .setColor(0x6b7280)
            .setDescription('Selection timed out. Use `!tag` again to try.')
          ],
          components: [],
        })
      }
    }
  } catch (err) {
    console.error('!tag command error:', err)
    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xef4444)
        .setDescription('Something went wrong processing the tag command.')
      ],
    }).catch(() => {})
  }
})

// ── Tag players to a specific sale ────────────────────────────────────────
async function tagPlayersToSale(
  message: Message,
  prisma: any,
  sale: any,
  found: Array<{ userId: string; displayName: string }>,
  notFound: string[],
  addedById: string
) {
  let addedCount = 0
  let skippedCount = 0

  for (const player of found) {
    try {
      await prisma.lootTabParticipant.upsert({
        where: {
          saleId_userId: { saleId: sale.id, userId: player.userId },
        },
        create: {
          saleId: sale.id,
          userId: player.userId,
          addedById,
        },
        update: {}, // Already exists — no change
      })
      addedCount++
    } catch (err: any) {
      // If it's a unique constraint violation, count as skipped
      if (err.code === 'P2002') {
        skippedCount++
      } else {
        console.error(`Failed to add participant ${player.displayName}:`, err)
      }
    }
  }

  // Get updated participant count
  const totalParticipants = await prisma.lootTabParticipant.count({
    where: { saleId: sale.id },
  })

  const embed = new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle('Players Tagged')
    .setDescription(`**${sale.description || 'Loot Tab Sale'}** — ${formatSilver(sale.price)} silver`)

  const lines: string[] = []
  lines.push(`**Added:** ${addedCount} player(s)`)
  if (skippedCount > 0) lines.push(`**Already tagged:** ${skippedCount}`)
  lines.push(`**Total participants:** ${totalParticipants}`)

  if (found.length > 0) {
    lines.push('')
    lines.push('**Players:**')
    for (const p of found) {
      lines.push(`- ${p.displayName}`)
    }
  }

  if (notFound.length > 0) {
    lines.push('')
    lines.push('**Not found:**')
    for (const name of notFound) {
      lines.push(`- ~~${name}~~`)
    }
  }

  embed.addFields({ name: 'Summary', value: lines.join('\n') })

  await message.reply({ embeds: [embed] })
}

// ── Start the bot ─────────────────────────────────────────────────────────
client.login(DISCORD_BOT_TOKEN)
