import { getFirstGuildSlug } from '@/lib/adminRedirect'
import { redirect } from 'next/navigation'

export default async function LegacyEditEventPage({ params }: { params: { id: string } }) {
  const slug = await getFirstGuildSlug()
  redirect(`/g/${slug}/admin/events/${params.id}/edit`)
}
