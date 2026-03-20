'use client'

import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useTransform, animate, motion } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  className?: string
  duration?: number
  formatFn?: (n: number) => string
}

export function AnimatedNumber({
  value,
  className,
  duration = 1,
  formatFn,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (latest) => {
    const rounded = Math.round(latest)
    return formatFn ? formatFn(rounded) : rounded.toLocaleString()
  })

  useEffect(() => {
    if (!isInView) return

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    })

    return controls.stop
  }, [isInView, value, duration, motionValue])

  return <motion.span ref={ref} className={className}>{display}</motion.span>
}
