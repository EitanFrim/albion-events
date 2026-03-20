'use client'

import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/animations'
import type { ReactNode } from 'react'

export default function GuildTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}
