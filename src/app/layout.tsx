export const dynamic = 'force-dynamic';

import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from './providers'
import { ConditionalNavBar } from '@/components/ConditionalNavBar'

export const metadata: Metadata = {
  title: 'AlbionHQ — Tools for Albion Online',
  description: 'Guild management, event planning, and crafting tools for Albion Online',
  icons: {
    icon: '/images/branding/favicon.png',
    apple: '/images/branding/logo.png',
  },
  openGraph: {
    title: 'AlbionHQ — Tools for Albion Online',
    description: 'Guild management, event planning, and crafting tools for Albion Online',
    images: [{ url: '/images/branding/logo-wide.png', width: 1200, height: 630 }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ConditionalNavBar />
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
          <div className="fixed bottom-3 right-4 z-50 pointer-events-none select-none">
            <p className="text-xs font-mono text-text-muted/40 tracking-wide">
              By ZedFrim · Discord: ZedFrim
            </p>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
