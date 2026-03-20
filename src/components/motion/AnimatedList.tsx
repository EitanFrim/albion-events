'use client'

import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/animations'
import type { ReactNode } from 'react'

interface AnimatedListProps {
  children: ReactNode
  className?: string
  /** Use whileInView instead of on-mount */
  reveal?: boolean
}

export function AnimatedList({ children, className, reveal = false }: AnimatedListProps) {
  if (reveal) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className={className}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedListItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}
