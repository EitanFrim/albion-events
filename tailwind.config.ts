import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-russo)', 'sans-serif'],
        body: ['var(--font-chakra)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        bg: {
          base: '#0F0F23',
          surface: '#13132B',
          elevated: '#1A1A3E',
          overlay: '#222255',
        },
        accent: {
          DEFAULT: '#7C3AED',
          dim: '#4C1D95',
          glow: 'rgba(124,58,237,0.15)',
          light: '#A78BFA',
        },
        rose: {
          DEFAULT: '#F43F5E',
          dim: '#9F1239',
          glow: 'rgba(244,63,94,0.15)',
        },
        gold: {
          DEFAULT: '#eab308',
          dim: '#713f12',
        },
        neon: {
          purple: '#7C3AED',
          rose: '#F43F5E',
          cyan: '#06B6D4',
          blue: '#3B82F6',
        },
        border: {
          subtle: 'rgba(124,58,237,0.08)',
          DEFAULT: 'rgba(124,58,237,0.15)',
          strong: 'rgba(124,58,237,0.3)',
          glow: 'rgba(124,58,237,0.4)',
        },
        text: {
          primary: '#E2E8F0',
          secondary: '#94A3B8',
          muted: '#475569',
        },
      },
      boxShadow: {
        'glow-purple': '0 0 24px rgba(124,58,237,0.3)',
        'glow-rose': '0 0 24px rgba(244,63,94,0.3)',
        'glow-sm': '0 0 12px rgba(124,58,237,0.2)',
        'glow-lg': '0 0 48px rgba(124,58,237,0.25)',
        'glow-neon': '0 0 20px rgba(124,58,237,0.4), 0 0 40px rgba(124,58,237,0.2), 0 0 80px rgba(124,58,237,0.1)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        'card-hover': '0 8px 32px rgba(124,58,237,0.15), 0 4px 16px rgba(0,0,0,0.5)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
        // Keep old names for backwards compat
        'glow-orange': '0 0 24px rgba(124,58,237,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'grid-fade': 'gridFade 3s ease-in-out infinite',
        'aurora-1': 'aurora1 8s ease-in-out infinite alternate',
        'aurora-2': 'aurora2 6s ease-in-out infinite alternate-reverse',
        'aurora-3': 'aurora3 10s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
        'text-shimmer': 'textShimmer 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,58,237,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(124,58,237,0.4)' },
        },
        gridFade: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        aurora1: {
          '0%': { transform: 'translateX(-100px) translateY(-50px) rotate(0deg) scale(1)' },
          '50%': { transform: 'translateX(50px) translateY(30px) rotate(180deg) scale(1.1)' },
          '100%': { transform: 'translateX(100px) translateY(-30px) rotate(360deg) scale(0.9)' },
        },
        aurora2: {
          '0%': { transform: 'translateX(80px) translateY(40px) rotate(45deg) scale(0.8)' },
          '50%': { transform: 'translateX(-30px) translateY(-20px) rotate(225deg) scale(1.2)' },
          '100%': { transform: 'translateX(-80px) translateY(60px) rotate(405deg) scale(0.9)' },
        },
        aurora3: {
          '0%': { transform: 'translateX(-50px) translateY(20px) rotate(90deg) scale(1.1)' },
          '50%': { transform: 'translateX(70px) translateY(-40px) rotate(270deg) scale(0.8)' },
          '100%': { transform: 'translateX(-20px) translateY(50px) rotate(450deg) scale(1.0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        textShimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },
  plugins: [],
}

export default config
