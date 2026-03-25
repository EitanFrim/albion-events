'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  color: string
}

const COLORS = [
  'rgba(124,58,237,0.4)',   // purple
  'rgba(167,139,250,0.3)',  // light purple
  'rgba(244,63,94,0.3)',    // rose
  'rgba(6,182,212,0.2)',    // cyan
]

export function ParticleField({ count = 40 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 5 + 4,
        delay: Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
    )
  }, [count])

  if (particles.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            y: [0, -60],
            scale: [0, 1, 0.3],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}
