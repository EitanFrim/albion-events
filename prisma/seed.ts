import { PrismaClient, EventStatus } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_ROLES = [
  { roleName: 'Tank', capacity: 2, tags: ['frontline'] },
  { roleName: 'Healer', capacity: 3, tags: ['support'] },
  { roleName: 'Arcane', capacity: 2, tags: ['support', 'must have cleanse'] },
  { roleName: 'Holy', capacity: 2, tags: ['support'] },
  { roleName: 'DPS Melee', capacity: 4, tags: ['dps'] },
  { roleName: 'DPS Ranged', capacity: 3, tags: ['dps'] },
  { roleName: 'Scout', capacity: 2, tags: ['mobility'] },
  { roleName: 'Battlemount', capacity: 2, tags: ['high IP'], minIp: 1300 },
]

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { discordUserId: '123456789' },
    update: {},
    create: {
      discordUserId: '123456789',
      discordName: 'GuildMaster#0001',
      avatarUrl: null,
      role: 'ADMIN',
    },
  })

  // Create a few player users
  const players = await Promise.all([
    prisma.user.upsert({
      where: { discordUserId: '987654321' },
      update: {},
      create: {
        discordUserId: '987654321',
        discordName: 'TankLord#1234',
        role: 'PLAYER',
      },
    }),
    prisma.user.upsert({
      where: { discordUserId: '111222333' },
      update: {},
      create: {
        discordUserId: '111222333',
        discordName: 'HealBot#5678',
        role: 'PLAYER',
      },
    }),
    prisma.user.upsert({
      where: { discordUserId: '444555666' },
      update: {},
      create: {
        discordUserId: '444555666',
        discordName: 'ShadowArcher#9999',
        role: 'PLAYER',
      },
    }),
  ])

  // Create a ZvZ event
  const event = await prisma.event.create({
    data: {
      title: 'ZvZ Crystal League — Saturday War',
      description:
        'Full ZvZ against Crimson Brotherhood. We need tight comps. Show up 15 minutes early for briefing. Voice required.',
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      timezone: 'UTC',
      locationNote: 'Faction Warfare Zone — Bridgewatch outskirts. Staging VC: #zvz-staging',
      status: EventStatus.PUBLISHED,
      createdById: admin.id,
      parties: {
        create: [
          {
            name: 'Party 1 — Main',
            displayOrder: 0,
            roleSlots: {
              create: DEFAULT_ROLES.map((r, i) => ({
                roleName: r.roleName,
                capacity: r.capacity,
                tags: r.tags,
                minIp: (r as any).minIp ?? null,
                displayOrder: i,
              })),
            },
          },
          {
            name: 'Party 2 — Support',
            displayOrder: 1,
            roleSlots: {
              create: [
                { roleName: 'Tank', capacity: 2, tags: ['frontline'], displayOrder: 0 },
                { roleName: 'Healer', capacity: 3, tags: ['support'], displayOrder: 1 },
                { roleName: 'Arcane', capacity: 2, tags: ['support'], displayOrder: 2 },
                { roleName: 'DPS Melee', capacity: 4, tags: ['dps'], displayOrder: 3 },
                { roleName: 'DPS Ranged', capacity: 3, tags: ['dps'], displayOrder: 4 },
                { roleName: 'Scout', capacity: 2, tags: ['mobility'], displayOrder: 5 },
                { roleName: 'Battlemount', capacity: 2, tags: ['high IP'], minIp: 1300, displayOrder: 6 },
                { roleName: 'Flex', capacity: 2, tags: [], displayOrder: 7 },
              ],
            },
          },
        ],
      },
    },
    include: { parties: { include: { roleSlots: true } } },
  })

  // Add some signups
  await prisma.signup.createMany({
    data: [
      {
        eventId: event.id,
        userId: players[0].id,
        preferredRoles: ['Tank', 'Battlemount', 'DPS Melee'],
        note: '1350 IP, full T8 plate',
      },
      {
        eventId: event.id,
        userId: players[1].id,
        preferredRoles: ['Healer', 'Holy', 'Arcane'],
        note: '1280 IP healer main',
      },
      {
        eventId: event.id,
        userId: players[2].id,
        preferredRoles: ['DPS Ranged', 'Scout', 'DPS Melee'],
        note: 'Can play crossbow or bow',
      },
    ],
  })

  // Create a second (draft) event
  await prisma.event.create({
    data: {
      title: 'Hellgate 2v2 — Tuesday Grind',
      description: 'Small group hellgates for fame and loot. Pairs sign up together.',
      startTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      timezone: 'UTC',
      locationNote: 'Hellgate portal — Thetford zone',
      status: EventStatus.DRAFT,
      createdById: admin.id,
      parties: {
        create: [
          {
            name: 'Pair 1',
            displayOrder: 0,
            roleSlots: {
              create: [
                { roleName: 'DPS', capacity: 1, tags: [], displayOrder: 0 },
                { roleName: 'Healer', capacity: 1, tags: [], displayOrder: 1 },
              ],
            },
          },
        ],
      },
    },
  })

  console.log('✓ Seed complete')
  console.log(`Admin: ${admin.discordName} (id: ${admin.id})`)
  console.log(`Event: ${event.title} (id: ${event.id})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
