import { getFirstGuildSlug } from '@/lib/adminRedirect'
import { redirect } from 'next/navigation'

export default async function LegacyTemplatesPage() {
  const slug = await getFirstGuildSlug()
  redirect(`/g/${slug}/admin/templates`)
}
