'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { patchNotes } from '@/lib/patch-notes'
import {
  staggerContainer,
  staggerItem,
  scaleIn,
  slideUp,
  fadeIn,
  float,
  glowPulse,
  transitions,
} from '@/lib/animations'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { AnimatedList, AnimatedListItem } from '@/components/motion/AnimatedList'

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Events & Signups',
    desc: 'Create ZvZ, ganking, HG events. Members sign up with preferred roles. Officers lock and assign compositions.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Comp Builder',
    desc: 'Build reusable compositions with custom roles, color-coded categories, and pre-defined build setups per weapon.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Loot Splits',
    desc: 'Fair loot tab sales with draw system. Track silver balances, regear deductions, and full payout history.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Siphoned Energy',
    desc: 'Import energy logs from the game. Track debts per member. Auto-DM players who owe energy via Discord.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Guild Dashboard',
    desc: 'Member roster, weekly attendance leaderboard, activity feed, and upcoming events — all on one homepage.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
      </svg>
    ),
    title: 'Discord Bot',
    desc: 'Event announcements, loot draws, balance checks, and DM notifications — all from your Discord server.',
  },
]

const steps = [
  { num: '1', title: 'Sign in with Discord', desc: 'One click. No forms, no passwords, no downloads.' },
  { num: '2', title: 'Create or join a guild', desc: 'Link your Discord server. Officers sync automatically.' },
  { num: '3', title: 'Start managing', desc: 'Plan events, build comps, split loot, track energy.' },
]

// Animated gradient orbs for background
function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <Image
        src="/images/backgrounds/hero-bg.png"
        alt=""
        fill
        className="object-cover opacity-[0.08]"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-base/60 to-bg-base" />

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-accent/[0.07] blur-[120px]"
        animate={{
          x: [0, 60, 0],
          y: [0, 40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-indigo-500/[0.05] blur-[120px]"
        animate={{
          x: [0, -40, 0],
          y: [0, 60, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[0%] left-[40%] w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[100px]"
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// Particle field for hero — client-only to avoid hydration mismatch
function ParticleField() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number }>>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 4 + 4,
        delay: Math.random() * 4,
      }))
    )
  }, [])

  if (particles.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-accent/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -40],
            scale: [0, 1, 0.5],
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

export default function HomePage() {
  const latestPatch = patchNotes[0]
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -50])

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[90vh] flex items-center">
        <HeroBackground />
        <ParticleField />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="max-w-5xl mx-auto px-4 pt-24 pb-20 text-center relative z-10"
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Logo */}
            <motion.div variants={staggerItem} className="flex justify-center">
              <motion.div
                animate={float}
                className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center overflow-hidden shadow-glow-sm"
              >
                <Image src="/images/branding/logo.png" alt="AlbionHQ" width={56} height={56} className="object-contain" />
              </motion.div>
            </motion.div>

            {/* Title with letter stagger */}
            <motion.div variants={staggerItem}>
              <h1 className="font-display text-5xl sm:text-7xl font-800 text-text-primary tracking-tight">
                {'AlbionHQ'.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05, ...transitions.smooth }}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              variants={staggerItem}
              className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
            >
              The free guild management suite for Albion Online. Events, comps, loot splits, siphoned energy, Discord bot — everything your guild needs in one place.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/guilds"
                  className="btn-primary px-8 py-3.5 text-base font-semibold rounded-xl shadow-glow-orange transition-all duration-300 relative overflow-hidden group"
                >
                  <span className="relative z-10">Get Started — Free</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-accent via-orange-400 to-accent bg-[length:200%_100%]"
                    animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/crafting"
                  className="btn-secondary px-8 py-3.5 text-base font-semibold rounded-xl transition-all duration-300"
                >
                  Crafting Calculator
                </Link>
              </motion.div>
            </motion.div>

            {/* Tagline */}
            <motion.p variants={staggerItem} className="text-text-muted text-xs pt-2">
              No downloads. No fees. Sign in with Discord and go.
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg className="w-6 h-6 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <ScrollReveal className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-700 text-text-primary mb-3">
            Everything your guild needs
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            Built by an Albion player for guild leaders who are tired of spreadsheets and manual tracking.
          </p>
        </ScrollReveal>

        <AnimatedList reveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <AnimatedListItem key={f.title}>
              <motion.div
                whileHover={{
                  y: -4,
                  borderColor: 'rgba(255,255,255,0.18)',
                  backgroundColor: 'rgba(24,24,31,1)',
                  transition: { duration: 0.2 },
                }}
                className="rounded-xl border border-border bg-bg-surface p-6 transition-colors duration-300 cursor-default h-full"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={transitions.spring}
                  className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4"
                >
                  {f.icon}
                </motion.div>
                <h3 className="font-display text-base font-600 text-text-primary mb-2">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            </AnimatedListItem>
          ))}
        </AnimatedList>
      </section>

      {/* How It Works */}
      <ScrollReveal>
        <section className="max-w-5xl mx-auto px-4 pb-24">
          <div className="rounded-2xl border border-border bg-bg-surface/80 backdrop-blur-sm p-8 sm:p-12 relative overflow-hidden">
            {/* Subtle glow behind */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-accent/[0.06] blur-[80px] pointer-events-none" />

            <h2 className="font-display text-2xl sm:text-3xl font-700 text-text-primary mb-10 text-center relative">
              Up and running in 2 minutes
            </h2>

            <div className="grid sm:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden sm:block absolute top-6 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, ...transitions.smooth }}
                  className="text-center relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 relative z-10"
                  >
                    <span className="font-display text-lg font-700 text-accent">{step.num}</span>
                  </motion.div>
                  <h3 className="text-text-primary font-semibold mb-2">{step.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* App Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Guild Management Card */}
          <ScrollReveal delay={0}>
            <Link
              href="/guilds"
              className="group block rounded-2xl border border-border bg-bg-surface overflow-hidden shadow-card transition-all duration-300 ease-out-expo hover:shadow-card-hover hover:border-border-strong cursor-pointer"
            >
              <motion.div
                className="relative h-44 overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={transitions.spring}
              >
                <Image
                  src="/images/cards/guild-management.png"
                  alt=""
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/60 to-transparent" />
              </motion.div>
              <div className="p-6 -mt-8 relative">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    transition={transitions.spring}
                    className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </motion.div>
                  <h2 className="font-display text-xl font-700 text-text-primary group-hover:text-accent transition-colors duration-300">
                    Guild Management
                  </h2>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  Full guild event planner with compositions, signups, role assignments, loot distribution, and Discord integration.
                </p>
                <div className="flex items-center gap-2 text-xs text-text-muted group-hover:text-accent/60 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" opacity={0.6}>
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                  Sign in with Discord
                  <motion.svg
                    className="w-4 h-4 ml-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </motion.svg>
                </div>
              </div>
            </Link>
          </ScrollReveal>

          {/* Crafting Calculator Card */}
          <ScrollReveal delay={0.15}>
            <Link
              href="/crafting"
              className="group block rounded-2xl border border-border bg-bg-surface overflow-hidden shadow-card transition-all duration-300 ease-out-expo hover:shadow-card-hover hover:border-border-strong cursor-pointer"
            >
              <motion.div
                className="relative h-44 overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={transitions.spring}
              >
                <Image
                  src="/images/cards/crafting-calculator.png"
                  alt=""
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/60 to-transparent" />
              </motion.div>
              <div className="p-6 -mt-8 relative">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    transition={transitions.spring}
                    className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </motion.div>
                  <h2 className="font-display text-xl font-700 text-text-primary group-hover:text-gold transition-colors duration-300">
                    Crafting Calculator
                  </h2>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  Real-time refining and transmutation profit calculator with live market prices from all cities.
                </p>
                <div className="flex items-center text-xs text-text-muted group-hover:text-gold/60 transition-colors">
                  No login required
                  <motion.svg
                    className="w-4 h-4 ml-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </motion.svg>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Latest Update Banner */}
      {latestPatch && (
        <ScrollReveal>
          <section className="max-w-5xl mx-auto px-4 pb-24">
            <Link
              href="/patch-notes"
              className="group block rounded-2xl border border-border bg-bg-surface p-6 sm:p-8 transition-all duration-300 hover:border-border-strong cursor-pointer relative overflow-hidden"
            >
              {/* Subtle accent glow on hover */}
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-accent/[0.04] blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-start justify-between gap-4 relative">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <motion.span
                      initial={{ scale: 0.8 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/20"
                    >
                      v{latestPatch.version}
                    </motion.span>
                    <span className="text-xs text-text-muted">{latestPatch.date}</span>
                  </div>
                  <h3 className="font-display text-lg font-600 text-text-primary mb-3 group-hover:text-accent transition-colors">
                    {latestPatch.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {latestPatch.changes.slice(0, 4).map((c, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, ...transitions.smooth }}
                        className="text-text-secondary text-sm flex items-start gap-2"
                      >
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          c.type === 'added' ? 'bg-green-400' : c.type === 'fixed' ? 'bg-blue-400' : 'bg-amber-400'
                        }`} />
                        {c.text}
                      </motion.li>
                    ))}
                    {latestPatch.changes.length > 4 && (
                      <li className="text-text-muted text-sm pl-3.5">
                        +{latestPatch.changes.length - 4} more changes
                      </li>
                    )}
                  </ul>
                </div>
                <svg className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </section>
        </ScrollReveal>
      )}

      {/* Footer CTA */}
      <ScrollReveal>
        <section className="max-w-5xl mx-auto px-4 pb-28">
          <div className="text-center relative">
            {/* Background glow */}
            <div className="absolute inset-0 -top-20 flex justify-center pointer-events-none">
              <div className="w-[400px] h-[200px] bg-accent/[0.06] blur-[100px]" />
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-700 text-text-primary mb-3 relative">
              Ready to level up your guild?
            </h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto relative">
              Join guilds already using AlbionHQ to run smoother events, fairer loot, and happier members.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="inline-block relative">
              <Link
                href="/guilds"
                className="btn-primary px-8 py-3.5 text-base font-semibold rounded-xl shadow-glow-orange transition-all duration-300"
              >
                Get Started — Free
              </Link>
            </motion.div>
            <div className="flex items-center justify-center gap-6 mt-8 text-xs text-text-muted relative">
              <Link href="/patch-notes" className="hover:text-accent transition-colors">Patch Notes</Link>
              <span className="w-1 h-1 rounded-full bg-text-muted/30" />
              <Link href="/crafting" className="hover:text-accent transition-colors">Crafting Calculator</Link>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}
