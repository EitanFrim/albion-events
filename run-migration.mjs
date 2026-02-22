import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function main() {
  console.log('Starting migration...')

  // 1. Find first admin user (or first user)
  let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })
  if (!adminUser) {
    adminUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  }
  if (!adminUser) throw new Error('No users found. Log in first to create an account, then run this again.')
  console.log(`Using owner: ${adminUser.discordName} (${adminUser.id})`)

  // 2. Create guild if none exists
  let guild = await prisma.guild.findFirst()
  if (!guild) {
    let inviteCode = generateInviteCode()
    while (await prisma.guild.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode()
    }
    guild = await prisma.guild.create({
      data: {
        name: 'My Guild',
        slug: 'my-guild',
        description: 'Default guild migrated from single-guild setup.',
        inviteCode,
        ownerId: adminUser.id,
      },
    })
    console.log(`Created guild: "${guild.name}" (slug: ${guild.slug}, invite: ${guild.inviteCode})`)
  } else {
    console.log(`Guild already exists: "${guild.name}" (${guild.id})`)
  }

  // 3. Add all users as guild members
  const allUsers = await prisma.user.findMany()
  console.log(`Adding ${allUsers.length} user(s) as guild members...`)
  for (const user of allUsers) {
    const role = user.id === adminUser.id ? 'OWNER' : user.role === 'ADMIN' ? 'OFFICER' : 'PLAYER'
    await prisma.guildMembership.upsert({
      where: { userId_guildId: { userId: user.id, guildId: guild.id } },
      create: {
        userId: user.id,
        guildId: guild.id,
        role,
        status: 'ACTIVE',
        verifiedAt: new Date(),
        joinedAt: user.createdAt ?? new Date(),
      },
      update: {},
    })
    console.log(`  ${user.discordName} -> ${role}`)
  }

  console.log('\nMigration complete!')
  console.log(`\nYour guild URL: /g/${guild.slug}`)
  console.log(`Invite code:    ${guild.inviteCode}`)
  console.log(`\nOpen http://localhost:3000 to get started.`)
}

main()
  .catch(e => { console.error(e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
