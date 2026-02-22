import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        bg: {
          base: '#0a0a0f',
          surface: '#111118',
          elevated: '#18181f',
          overlay: '#1f1f28',
        },
        accent: {
          DEFAULT: '#f97316',
          dim: '#7c3d12',
          glow: 'rgba(249,115,22,0.15)',
        },
        gold: {
          DEFAULT: '#eab308',
          dim: '#713f12',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.1)',
          strong: 'rgba(255,255,255,0.18)',
        },
        text: {
          primary: '#f1f1f3',
          secondary: '#8b8b9a',
          muted: '#4a4a58',
        },
      },
      boxShadow: {
        'glow-orange': '0 0 24px rgba(249,115,22,0.25)',
        'glow-sm': '0 0 12px rgba(249,115,22,0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
    },
  },
  plugins: [],
}

export default config
