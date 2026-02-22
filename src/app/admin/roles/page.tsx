export const dynamic = 'force-dynamic';

import { getFirstGuildSlug } from '@/lib/adminRedirect'
import { redirect } from 'next/navigation'

export default async function LegacyRolesPage() {
  const slug = await getFirstGuildSlug()
  redirect(`/g/${slug}/admin/roles`)
}
