import 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      discordId: string
      discordName: string
      role: UserRole
      inGameName: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    discordId?: string
    role?: string
  }
}
