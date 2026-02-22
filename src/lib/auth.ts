import { NextAuthOptions } from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: 'identify' } },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider !== 'discord') return false
      const discordProfile = profile as any

      await prisma.user.upsert({
        where: { discordUserId: discordProfile.id },
        update: {
          discordName: discordProfile.username,
          avatarUrl: user.image ?? null,
        },
        create: {
          discordUserId: discordProfile.id,
          discordName: discordProfile.username,
          avatarUrl: user.image ?? null,
          role: 'PLAYER',
        },
      })

      return true
    },

    async jwt({ token, account, profile }) {
      // On initial login, look up and store the DB user id directly in the token
      if (account && profile) {
        const discordProfile = profile as any
        token.discordId = discordProfile.id
        const dbUser = await prisma.user.findUnique({ where: { discordUserId: discordProfile.id } })
        if (dbUser) token.dbUserId = dbUser.id
      }

      // Repair stale tokens that have discordId but no dbUserId
      if (!token.dbUserId && token.discordId) {
        const dbUser = await prisma.user.findUnique({ where: { discordUserId: token.discordId as string } })
        if (dbUser) token.dbUserId = dbUser.id
      }

      // Last resort: try token.sub (NextAuth sets it to the provider account ID)
      if (!token.dbUserId && !token.discordId && token.sub) {
        token.discordId = token.sub
        const dbUser = await prisma.user.findUnique({ where: { discordUserId: token.sub } })
        if (dbUser) token.dbUserId = dbUser.id
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        // Use the stored DB user id directly — no extra DB query needed
        if (token.dbUserId) {
          const dbUser = await prisma.user.findUnique({ where: { id: token.dbUserId as string } })
          if (dbUser) {
            session.user.id = dbUser.id
            session.user.discordId = dbUser.discordUserId
            session.user.discordName = dbUser.discordName
            session.user.role = dbUser.role
            session.user.inGameName = dbUser.inGameName
          }
        } else if (token.discordId) {
          // Fallback for tokens without dbUserId
          const dbUser = await prisma.user.findUnique({ where: { discordUserId: token.discordId as string } })
          if (dbUser) {
            session.user.id = dbUser.id
            session.user.discordId = dbUser.discordUserId
            session.user.discordName = dbUser.discordName
            session.user.role = dbUser.role
            session.user.inGameName = dbUser.inGameName
          }
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
