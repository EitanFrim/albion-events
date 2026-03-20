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
  metadataBase: new URL('https://albionhq.app'),
  openGraph: {
    title: 'AlbionHQ — Tools for Albion Online',
    description: 'Guild management, event planning, and crafting tools for Albion Online',
    images: [{ url: '/images/branding/logo-wide.png', width: 1200, height: 630 }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg-base text-text-primary antialiased">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(249,115,22,0.05)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_80%_80%,rgba(99,102,241,0.03)_0%,transparent_50%)]" />
        </div>
        <SessionProvider>
          <div className="relative z-10">
            <ConditionalNavBar />
            <main className="min-h-[calc(100vh-64px)]">
              {children}
            </main>
            <div className="fixed bottom-3 right-4 z-50 pointer-events-none select-none">
              <p className="text-xs font-mono text-text-muted/40 tracking-wide">
                By ZedFrim · Discord: ZedFrim
              </p>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
