'use client'

import { motion } from 'framer-motion'
import { scrollReveal, cardHover, transitions } from '@/lib/animations'
import type { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  reveal?: boolean
  delay?: number
}

export function AnimatedCard({
  children,
  className,
  hover = true,
  reveal = true,
  delay = 0,
}: AnimatedCardProps) {
  return (
    <motion.div
      variants={reveal ? scrollReveal : undefined}
      initial={reveal ? 'hidden' : undefined}
      whileInView={reveal ? 'visible' : undefined}
      viewport={reveal ? { once: true, margin: '-60px' } : undefined}
      whileHover={hover ? { scale: 1.02, y: -4, transition: transitions.spring } : undefined}
      transition={delay ? { delay } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  )
}
