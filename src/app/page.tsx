'use client'

import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { patchNotes } from '@/lib/patch-notes'
import {
  staggerContainer,
  staggerItem,
  heroTextReveal,
  neonGlow,
  transitions,
} from '@/lib/animations'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { AnimatedList, AnimatedListItem } from '@/components/motion/AnimatedList'
import { AuroraBackground } from '@/components/backgrounds/AuroraBackground'
import { ParticleField } from '@/components/backgrounds/ParticleField'
import { GridBackground } from '@/components/backgrounds/GridBackground'
import { Card3D } from '@/components/ui/Card3D'

// Lazy load the 3D sphere to avoid SSR issues with Three.js
const HeroSphere = dynamic(
  () => import('@/components/backgrounds/HeroSphere').then(mod => ({ default: mod.HeroSphere })),
  { ssr: false }
)

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Events & Signups',
    desc: 'Create ZvZ, ganking, HG events. Members sign up with preferred roles. Officers lock and assign compositions.',
    color: 'from-accent to-accent-light',
    glowColor: 'rgba(124,58,237,0.3)',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Comp Builder',
    desc: 'Build reusable compositions with custom roles, color-coded categories, and pre-defined build setups.',
    color: 'from-neon-cyan to-neon-blue',
    glowColor: 'rgba(6,182,212,0.3)',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Loot Splits',
    desc: 'Fair loot tab sales with draw system. Track silver balances, regear deductions, and full payout history.',
    color: 'from-neon-rose to-rose-dim',
    glowColor: 'rgba(244,63,94,0.3)',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Siphoned Energy',
    desc: 'Import energy logs from the game. Track debts per member. Auto-DM players who owe energy via Discord.',
    color: 'from-amber-400 to-amber-600',
    glowColor: 'rgba(245,158,11,0.3)',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Guild Dashboard',
    desc: 'Member roster, weekly attendance leaderboard, activity feed, and upcoming events all in one place.',
    color: 'from-emerald-400 to-emerald-600',
    glowColor: 'rgba(52,211,153,0.3)',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
      </svg>
    ),
    title: 'Discord Bot',
    desc: 'Event announcements, loot draws, balance checks, and DM notifications from your Discord server.',
    color: 'from-indigo-400 to-indigo-600',
    glowColor: 'rgba(99,102,241,0.3)',
  },
]

const steps = [
  {
    num: '01',
    title: 'Sign in with Discord',
    desc: 'One click. No forms, no passwords, no downloads.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Create or join a guild',
    desc: 'Link your Discord server. Officers sync automatically.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Start managing',
    desc: 'Plan events, build comps, split loot, track energy.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
]

export default function HomePage() {
  const latestPatch = patchNotes[0]
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  const sphereOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  return (
    <div className="min-h-screen">
      {/* ============= HERO SECTION ============= */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Sphere background */}
        <motion.div style={{ opacity: sphereOpacity }} className="absolute inset-0">
          <HeroSphere />
        </motion.div>

        {/* Aurora + particles */}
        <AuroraBackground className="absolute inset-0" />
        <ParticleField count={50} />

        {/* Radial gradient overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#0F0F23_70%)] z-[5]" />

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 max-w-5xl mx-auto px-4 text-center"
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Logo */}
            <motion.div variants={staggerItem} className="flex justify-center">
              <motion.div
                animate={{
                  y: [-6, 6],
                  transition: { y: { duration: 3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
                }}
                className="w-24 h-24 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center overflow-hidden shadow-glow-purple"
              >
                <Image src="/images/branding/logo.png" alt="AlbionHQ" width={64} height={64} className="object-contain" priority />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.div variants={staggerItem}>
              <motion.h1
                className="font-display text-6xl sm:text-8xl lg:text-9xl text-text-primary tracking-wider"
                animate={neonGlow}
              >
                {'ALBIONHQ'.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              variants={heroTextReveal}
              className="text-lg sm:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed font-body font-light"
            >
              <span className="text-text-secondary">Command Your Guild.</span>{' '}
              <span className="text-gradient-neon font-medium">Dominate the Battlefield.</span>
            </motion.p>

            {/* Tagline */}
            <motion.p variants={staggerItem} className="text-text-muted text-sm max-w-xl mx-auto">
              The free guild management suite for Albion Online. Events, comps, loot splits, siphoned energy, Discord bot — everything in one place.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/guilds"
                  className="btn-neon px-10 py-4 text-base rounded-xl relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started — Free
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/crafting"
                  className="btn-secondary px-10 py-4 text-base rounded-xl border-accent/20 hover:border-accent/40 hover:shadow-glow-sm"
                >
                  Crafting Calculator
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-accent/30 flex items-start justify-center p-1.5">
            <motion.div
              className="w-1 h-2 rounded-full bg-accent"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </section>

      {/* ============= FEATURES GRID ============= */}
      <section className="relative py-32">
        <GridBackground />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-16">
            <motion.span className="inline-block text-xs font-mono text-accent uppercase tracking-[0.3em] mb-4">
              Features
            </motion.span>
            <h2 className="font-display text-3xl sm:text-5xl text-text-primary mb-4 tracking-wide">
              Everything Your Guild Needs
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto text-lg">
              Built by an Albion player for guild leaders tired of spreadsheets.
            </p>
          </ScrollReveal>

          <AnimatedList reveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <AnimatedListItem key={f.title}>
                <Card3D glowColor={f.glowColor} className="p-6 h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-5`}>
                    {f.icon}
                  </div>
                  <h3 className="font-display text-lg text-text-primary mb-2 tracking-wide">{f.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
                </Card3D>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        </div>
      </section>

      {/* ============= HOW IT WORKS ============= */}
      <section className="relative py-32">
        <div className="max-w-5xl mx-auto px-4">
          <ScrollReveal>
            <div className="glass-card-neon p-8 sm:p-12 relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-accent/[0.08] blur-[100px] pointer-events-none" />

              <div className="text-center mb-12 relative">
                <span className="inline-block text-xs font-mono text-accent uppercase tracking-[0.3em] mb-4">
                  Quick Start
                </span>
                <h2 className="font-display text-2xl sm:text-4xl text-text-primary tracking-wide">
                  Up and Running in 2 Minutes
                </h2>
              </div>

              <div className="grid sm:grid-cols-3 gap-8 relative">
                {/* Connecting line */}
                <div className="hidden sm:block absolute top-10 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

                {steps.map((step, i) => (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, ...transitions.smooth }}
                    className="text-center relative"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(124,58,237,0.3)' }}
                      className="w-16 h-16 rounded-2xl bg-bg-elevated border border-accent/20 flex items-center justify-center mx-auto mb-5 relative z-10 text-accent"
                    >
                      {step.icon}
                    </motion.div>
                    <span className="inline-block font-mono text-xs text-accent/60 mb-2">{step.num}</span>
                    <h3 className="text-text-primary font-display text-base mb-2 tracking-wide">{step.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============= APP CARDS ============= */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Guild Management */}
          <ScrollReveal delay={0}>
            <Link href="/guilds" className="group block cursor-pointer">
              <Card3D className="overflow-hidden">
                <motion.div className="relative h-44 overflow-hidden" whileHover={{ scale: 1.02 }} transition={transitions.spring}>
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h2 className="font-display text-xl text-text-primary group-hover:text-accent transition-colors duration-300 tracking-wide">
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
                    <svg className="w-4 h-4 ml-auto transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Card3D>
            </Link>
          </ScrollReveal>

          {/* Crafting Calculator */}
          <ScrollReveal delay={0.15}>
            <Link href="/crafting" className="group block cursor-pointer">
              <Card3D glowColor="rgba(234,179,8,0.3)" className="overflow-hidden">
                <motion.div className="relative h-44 overflow-hidden" whileHover={{ scale: 1.02 }} transition={transitions.spring}>
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="font-display text-xl text-text-primary group-hover:text-gold transition-colors duration-300 tracking-wide">
                      Crafting Calculator
                    </h2>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4">
                    Real-time refining and transmutation profit calculator with live market prices from all cities.
                  </p>
                  <div className="flex items-center text-xs text-text-muted group-hover:text-gold/60 transition-colors">
                    No login required
                    <svg className="w-4 h-4 ml-auto transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Card3D>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ============= LATEST UPDATE ============= */}
      {latestPatch && (
        <ScrollReveal>
          <section className="max-w-5xl mx-auto px-4 pb-24">
            <Link
              href="/patch-notes"
              className="group block glass-card-neon p-6 sm:p-8 cursor-pointer relative overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-accent/[0.06] blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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
                  <h3 className="font-display text-lg text-text-primary mb-3 group-hover:text-accent transition-colors tracking-wide">
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
                          c.type === 'added' ? 'bg-emerald-400' : c.type === 'fixed' ? 'bg-neon-blue' : 'bg-amber-400'
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
                <svg className="w-5 h-5 text-text-muted group-hover:text-accent transition-all flex-shrink-0 mt-1 group-hover:translate-x-1 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </section>
        </ScrollReveal>
      )}

      {/* ============= FOOTER CTA ============= */}
      <section className="relative py-32">
        <ScrollReveal>
          <div className="max-w-5xl mx-auto px-4 text-center relative">
            {/* Background glow */}
            <div className="absolute inset-0 -top-20 flex justify-center pointer-events-none">
              <div className="w-[500px] h-[300px] bg-accent/[0.08] blur-[120px]" />
            </div>

            <span className="inline-block text-xs font-mono text-accent uppercase tracking-[0.3em] mb-4 relative">
              Join Now
            </span>
            <h2 className="font-display text-3xl sm:text-5xl text-text-primary mb-4 relative tracking-wide">
              Ready to Level Up Your Guild?
            </h2>
            <p className="text-text-secondary mb-10 max-w-md mx-auto text-lg relative">
              Join guilds already using AlbionHQ for smoother events, fairer loot, and happier members.
            </p>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }} className="inline-block relative">
              <Link
                href="/guilds"
                className="btn-neon px-10 py-4 text-base rounded-xl shadow-glow-neon"
              >
                Get Started — Free
              </Link>
            </motion.div>
            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-text-muted relative">
              <Link href="/patch-notes" className="hover:text-accent transition-colors cursor-pointer">Patch Notes</Link>
              <span className="w-1 h-1 rounded-full bg-accent/30" />
              <Link href="/crafting" className="hover:text-accent transition-colors cursor-pointer">Crafting Calculator</Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}
