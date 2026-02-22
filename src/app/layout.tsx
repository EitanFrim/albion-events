export const dynamic = 'force-dynamic';

import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from './providers'
import { ConditionalNavBar } from '@/components/ConditionalNavBar'

export const metadata: Metadata = {
  title: 'Albion Events — Guild Content Planner',
  description: 'Guild event signup and composition planner for Albion Online',
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
