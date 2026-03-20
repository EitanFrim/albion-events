'use client'

import { motion } from 'framer-motion'
import { transitions } from '@/lib/animations'
import type { ReactNode } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  direction?: Direction
  delay?: number
  duration?: number
  distance?: number
}

const getInitial = (direction: Direction, distance: number) => {
  const map = {
    up: { opacity: 0, y: distance },
    down: { opacity: 0, y: -distance },
    left: { opacity: 0, x: distance },
    right: { opacity: 0, x: -distance },
  }
  return map[direction]
}

const getVisible = (direction: Direction) => {
  const base = { opacity: 1 }
  if (direction === 'up' || direction === 'down') return { ...base, y: 0 }
  return { ...base, x: 0 }
}

export function ScrollReveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 30,
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={getInitial(direction, distance)}
      whileInView={{
        ...getVisible(direction),
        transition: {
          ...transitions.smooth,
          duration,
          delay,
        },
      }}
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
