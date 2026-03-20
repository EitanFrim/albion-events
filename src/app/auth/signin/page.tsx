'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem, scaleIn, transitions } from '@/lib/animations'

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const error = searchParams.get('error')

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <motion.div
        className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-accent/[0.05] blur-[120px]"
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-indigo-500/[0.04] blur-[100px]"
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 p-8 max-w-sm w-full text-center rounded-2xl border border-white/[0.08] backdrop-blur-xl"
        style={{ background: 'rgba(17, 17, 24, 0.6)', boxShadow: '0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }}
      >
        {/* Shield icon with draw animation */}
        <motion.div variants={staggerItem} className="flex justify-center mb-6">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={transitions.spring}
            className="w-16 h-16 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center"
          >
            <motion.svg
              className="w-8 h-8 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            >
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.5, ease: 'easeInOut' }}
              />
            </motion.svg>
          </motion.div>
        </motion.div>

        <motion.h1 variants={staggerItem} className="font-display text-2xl font-bold text-text-primary mb-2">
          Sign In
        </motion.h1>
        <motion.p variants={staggerItem} className="text-text-secondary font-body text-sm mb-6">
          Connect your Discord account to sign up for guild events and track your role assignments.
        </motion.p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-3 py-2 bg-red-900/30 border border-red-800/50 rounded text-xs text-red-400 font-mono"
          >
            {error === 'OAuthCallback' ? 'Discord authentication failed. Try again.' : error}
          </motion.div>
        )}

        <motion.div variants={staggerItem}>
          <motion.button
            onClick={() => signIn('discord', { callbackUrl })}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full justify-center text-sm py-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Continue with Discord
          </motion.button>
        </motion.div>

        <motion.p variants={staggerItem} className="text-text-muted/50 text-xs font-mono mt-4">
          Your Discord identity is used only for event management.
        </motion.p>
      </motion.div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  )
}
