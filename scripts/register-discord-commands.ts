/**
 * Register Discord slash commands.
 *
 * Usage:
 *   npx tsx scripts/register-discord-commands.ts              # global (takes ~1h to propagate)
 *   npx tsx scripts/register-discord-commands.ts <GUILD_ID>   # guild-scoped (instant, for dev)
 *
 * Requires DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN in .env
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env file manually (no dotenv dependency needed)
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

const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID || process.env.DISCORD_CLIENT_ID
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

if (!DISCORD_APPLICATION_ID || !DISCORD_BOT_TOKEN) {
  console.error('Missing DISCORD_APPLICATION_ID (or DISCORD_CLIENT_ID) and/or DISCORD_BOT_TOKEN in .env')
  process.exit(1)
}

const commands = [
  {
    name: 'register',
    description: 'Register as a verified member of the linked guild on Albion Events',
    type: 1,
    default_member_permissions: null, // everyone can use this
  },
  {
    name: 'setup',
    description: 'Link this Discord server to your Albion Events guild (owner only)',
    type: 1,
    options: [
      {
        name: 'member-role',
        description: 'The Discord role that qualifies members for registration',
        type: 8, // ROLE
        required: false,
      },
    ],
    default_member_permissions: '8', // ADMINISTRATOR
  },
  {
    name: 'verify-message',
    description: 'Post a verification message with a Register button in this channel',
    type: 1,
    default_member_permissions: '8', // ADMINISTRATOR
  },
]

async function registerCommands() {
  const guildId = process.argv[2]
  const url = guildId
    ? `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/guilds/${guildId}/commands`
    : `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`

  console.log(`Registering commands ${guildId ? `to guild ${guildId}` : 'globally'}...`)

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    },
    body: JSON.stringify(commands),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed (${response.status}):`, error)
    process.exit(1)
  }

  const data = await response.json()
  console.log(`Registered ${data.length} commands:`)
  for (const cmd of data) {
    console.log(`  /${cmd.name} (id: ${cmd.id})`)
  }
}

registerCommands()
