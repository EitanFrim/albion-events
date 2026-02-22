import { getFirstGuildSlug } from '@/lib/adminRedirect'
import { redirect } from 'next/navigation'

export default async function LegacyAssignPage({ params }: { params: { id: string } }) {
  const slug = await getFirstGuildSlug()
  redirect(`/g/${slug}/admin/events/${params.id}/assign`)
}
