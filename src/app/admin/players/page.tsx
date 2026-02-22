import { getFirstGuildSlug } from '@/lib/adminRedirect'
import { redirect } from 'next/navigation'

export default async function LegacyPlayersPage() {
  const slug = await getFirstGuildSlug()
  redirect(`/g/${slug}/admin/players`)
}
