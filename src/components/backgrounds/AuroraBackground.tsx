'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

function StarField({ count = 60 }: { count?: number }) {
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number; opacity: number }>>([])

  useEffect(() => {
    setStars(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
        opacity: Math.random() * 0.6 + 0.1,
      }))
    )
  }, [count])

  if (stars.length === 0) return null

  return (
    <>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute w-[2px] h-[2px] bg-white rounded-full"
          style={{ left: `${star.x}%`, top: `${star.y}%` }}
          animate={{ opacity: [0, star.opacity, 0] }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}
    </>
  )
}

export function AuroraBackground({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Aurora color blobs */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* Pulsing radial gradients */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 800px 600px at 30% 20%, rgba(124,58,237,0.25) 0%, transparent 50%),
              radial-gradient(ellipse 600px 400px at 70% 60%, rgba(244,63,94,0.15) 0%, transparent 50%)
            `,
          }}
        />

        {/* Animated blobs */}
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-accent/20 rounded-full blur-[120px]"
          animate={{
            x: [-50, 50, -50],
            y: [-20, 20, -20],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-neon-rose/15 rounded-full blur-[120px]"
          animate={{
            x: [50, -50, 50],
            y: [20, -20, 20],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-neon-blue/10 rounded-full blur-[100px]"
          animate={{
            x: [20, -20, 20],
            y: [-30, 30, -30],
          }}
          transition={{ duration: 30, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />

        {/* Stars */}
        <StarField count={60} />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
