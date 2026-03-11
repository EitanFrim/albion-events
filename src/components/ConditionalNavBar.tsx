'use client'

import { usePathname } from 'next/navigation'
import { NavBar } from './NavBar'

export function ConditionalNavBar() {
  const pathname = usePathname()

  // Landing page, guild pages, and crafting have their own layouts
  if (pathname === '/' || pathname.startsWith('/g/') || pathname.startsWith('/crafting')) return null

  return <NavBar />
}
