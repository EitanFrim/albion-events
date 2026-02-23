import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { GuildSettingsPanel } from '@/components/GuildSettingsPanel'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function GuildSettingsPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const guild = await prisma.guild.findUnique({ where: { slug: params.slug } })
  if (!guild) notFound()

  const membership = await prisma.guildMembership.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: guild.id } },
  })

  if (!membership || membership.role !== 'OWNER') redirect(`/g/${params.slug}`)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">Guild Owner</p>
        <h1 className="font-display text-2xl font-800 text-text-primary tracking-tight">Guild Settings</h1>
      </div>
      <GuildSettingsPanel
        guild={{ id: guild.id, name: guild.name, slug: guild.slug, inviteCode: guild.inviteCode, description: guild.description, logoUrl: guild.logoUrl, discordGuildId: guild.discordGuildId, discordMemberRoleId: guild.discordMemberRoleId, discordAllianceRoleId: guild.discordAllianceRoleId, discordBotInstalled: guild.discordBotInstalled }}
      />
    </div>
  )
}
