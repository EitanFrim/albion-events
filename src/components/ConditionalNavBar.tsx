'use client'

import { usePathname } from 'next/navigation'
import { NavBar } from './NavBar'

export function ConditionalNavBar() {
  const pathname = usePathname()

  // Guild pages have their own GuildNavBar in the guild layout
  if (pathname.startsWith('/g/')) return null

  return <NavBar />
}
