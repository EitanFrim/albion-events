'use client'

import { motion } from 'framer-motion'

export function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base grid */}
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Perspective grid fade */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(to bottom, transparent 0%, #0F0F23 85%),
            linear-gradient(to top, transparent 0%, #0F0F23 15%)
          `,
        }}
      />

      {/* Animated horizontal scan line */}
      <motion.div
        className="absolute left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)',
          boxShadow: '0 0 20px rgba(124,58,237,0.3)',
        }}
        animate={{ y: ['-10vh', '110vh'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Corner gradient accents */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-accent/[0.06] to-transparent" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-neon-rose/[0.04] to-transparent" />
    </div>
  )
}
