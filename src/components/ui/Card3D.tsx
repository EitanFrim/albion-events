'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface Card3DProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function Card3D({ children, className = '', glowColor = 'rgba(124,58,237,0.3)' }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const xPct = (e.clientX - rect.left) / rect.width - 0.5
    const yPct = (e.clientY - rect.top) / rect.height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      className={`glass-card-neon cursor-pointer ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{
          boxShadow: isHovered
            ? `0 0 30px ${glowColor}, 0 0 60px ${glowColor.replace('0.3', '0.15')}`
            : '0 0 0px transparent',
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
        style={{
          background: isHovered
            ? `radial-gradient(circle at ${50 + (x.get() || 0) * 100}% ${50 + (y.get() || 0) * 100}%, rgba(255,255,255,0.06) 0%, transparent 50%)`
            : 'none',
        }}
      />

      {/* Content with 3D depth */}
      <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </motion.div>
  )
}
