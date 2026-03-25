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
        {/* Global animated background layers */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-grid opacity-30" />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(124,58,237,0.08)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_80%_80%,rgba(244,63,94,0.04)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_30%_40%_at_10%_60%,rgba(6,182,212,0.03)_0%,transparent_50%)]" />

          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,#0F0F23_100%)]" />
        </div>

        <SessionProvider>
          <div className="relative z-10">
            <ConditionalNavBar />
            <main className="min-h-screen pt-20">
              {children}
            </main>
            <div className="fixed bottom-3 right-4 z-50 pointer-events-none select-none">
              <p className="text-[10px] font-mono text-text-muted/30 tracking-wide">
                By ZedFrim
              </p>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
