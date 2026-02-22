import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { OnboardingForm } from '@/components/OnboardingForm'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { inGameName: true },
  })

  // Already set in-game name — redirect home
  if (user?.inGameName) redirect('/')

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚔️</span>
          </div>
          <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight mb-2">
            Welcome to the Guild
          </h1>
          <p className="text-text-secondary text-sm">
            You&apos;re logged in as <span className="text-text-primary font-medium">{session.user.discordName}</span>
          </p>
        </div>

        <OnboardingForm
          hasInGameName={!!user?.inGameName}
          currentInGameName={user?.inGameName ?? ''}
          status="ACTIVE"
        />
      </div>
    </div>
  )
}
