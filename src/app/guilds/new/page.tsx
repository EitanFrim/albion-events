export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CreateGuildForm } from '@/components/CreateGuildForm'
import Link from 'next/link'

export default async function CreateGuildPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const existingOwned = await prisma.guild.findFirst({ where: { ownerId: session.user.id } })
  if (existingOwned) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 animate-fade-in text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-800 text-text-primary tracking-tight mb-2">Already a Guild Owner</h1>
        <p className="text-text-secondary text-sm mb-6">
          Each account can only create one guild. You already own <span className="text-text-primary font-semibold">{existingOwned.name}</span>.
        </p>
        <Link href={`/g/${existingOwned.slug}`} className="btn-primary">
          Go to {existingOwned.name} →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">Guild Setup</p>
        <h1 className="font-display text-3xl font-800 text-text-primary tracking-tight">Create a Guild</h1>
        <p className="text-text-secondary text-sm mt-2">
          You'll be the Guild Owner with full control over members, events, and settings.
        </p>
      </div>
      <CreateGuildForm />
    </div>
  )
}
