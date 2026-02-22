export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/ProfileForm'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { discordName: true, inGameName: true },
  })

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">Account</p>
        <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">Profile</h1>
        <p className="text-text-secondary text-sm mt-1">Set your in-game name so leaders can identify you on rosters.</p>
      </div>
      <ProfileForm discordName={user?.discordName ?? ''} currentInGameName={user?.inGameName ?? ''} />
    </div>
  )
}
