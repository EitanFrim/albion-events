import type { Variants, Transition } from 'framer-motion'

// ── Transition presets ──

export const transitions = {
  spring: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
  smooth: { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.4 } as Transition,
  quick: { type: 'tween', duration: 0.2, ease: 'easeOut' } as Transition,
  slow: { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.6 } as Transition,
  bouncy: { type: 'spring', stiffness: 400, damping: 25 } as Transition,
}

// ── Base variants ──

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.smooth },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitions.smooth },
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: transitions.smooth },
}

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: transitions.smooth },
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: transitions.smooth },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitions.smooth },
}

// ── Stagger variants ──

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
}

// ── Page transition ──

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.smooth, duration: 0.5 },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { ...transitions.quick },
  },
}

// ── Scroll reveal ──

export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.smooth, duration: 0.6 },
  },
}

// ── Card hover ──

export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: transitions.spring,
  },
}

// ── Dropdown / popover ──

export const dropdown: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...transitions.quick, duration: 0.15 },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -4,
    transition: { duration: 0.1 },
  },
}

// ── Float animation (for hero logo) ──

export const float = {
  y: [-4, 4],
  transition: {
    y: {
      duration: 3,
      repeat: Infinity,
      repeatType: 'reverse' as const,
      ease: 'easeInOut' as const,
    },
  },
}

// ── Glow pulse (updated to purple) ──

export const glowPulse = {
  boxShadow: [
    '0 0 12px rgba(124,58,237,0.2)',
    '0 0 24px rgba(124,58,237,0.4)',
    '0 0 12px rgba(124,58,237,0.2)',
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

// ── 3D Card tilt ──

export const tilt3D = {
  rest: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  hover: {
    scale: 1.02,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
}

// ── Hero text reveal ──

export const heroTextReveal: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { ...transitions.slow, duration: 0.8 },
  },
}

// ── Neon glow animation ──

export const neonGlow = {
  textShadow: [
    '0 0 10px rgba(124,58,237,0.5), 0 0 20px rgba(124,58,237,0.3), 0 0 40px rgba(124,58,237,0.1)',
    '0 0 20px rgba(124,58,237,0.8), 0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.2)',
    '0 0 10px rgba(124,58,237,0.5), 0 0 20px rgba(124,58,237,0.3), 0 0 40px rgba(124,58,237,0.1)',
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
}
