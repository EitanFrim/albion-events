'use client'

import { motion } from 'framer-motion';
import { SERVERS, type ServerKey } from '../data/items';
import { transitions } from '@/lib/animations';

interface HeaderProps {
  server: ServerKey;
  setServer: (s: ServerKey) => void;
  maxAgeHours: number;
  setMaxAgeHours: (h: number) => void;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  onRefresh: () => void;
  overrideCount: number;
  onClearOverrides: () => void;
}

const inputClass = "border rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-all duration-200";

export default function Header({
  server,
  setServer,
  maxAgeHours,
  setMaxAgeHours,
  loading,
  error,
  lastFetched,
  onRefresh,
  overrideCount,
  onClearOverrides,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.smooth}
      className="border-b px-8 py-5 sticky top-0 z-40 backdrop-blur-2xl"
      style={{
        backgroundColor: 'rgba(15, 15, 35, 0.85)',
        borderColor: 'rgba(124, 58, 237, 0.1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4), 0 0 60px rgba(124, 58, 237, 0.04)',
      }}>

      {/* Top glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.4), rgba(244, 63, 94, 0.3), transparent)',
        }}
      />

      <div className="max-w-[1600px] mx-auto">
        {/* Top row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <motion.a
              href="/"
              whileHover={{ scale: 1.05, boxShadow: '0 0 16px rgba(124, 58, 237, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                color: 'var(--color-text-secondary)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
              }}
            >
              <img src="/images/branding/logo.png" alt="" className="w-4 h-4 object-contain" />
              AlbionHQ
            </motion.a>
            <div>
              <h1 className="text-lg font-semibold tracking-tight font-display">
                <motion.span
                  className="bg-gradient-to-r from-purple-400 via-violet-300 to-fuchsia-400 bg-clip-text text-transparent neon-text"
                  animate={{
                    textShadow: [
                      '0 0 10px rgba(124,58,237,0.3)',
                      '0 0 20px rgba(124,58,237,0.5)',
                      '0 0 10px rgba(124,58,237,0.3)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Albion Refiner
                </motion.span>
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Refining &amp; transmutation profit calculator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Server */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                Server
              </label>
              <select
                value={server}
                onChange={(e) => setServer(e.target.value as ServerKey)}
                className={inputClass + " cursor-pointer appearance-none pr-8"}
                style={{
                  backgroundColor: 'rgba(124, 58, 237, 0.08)',
                  borderColor: 'rgba(124, 58, 237, 0.2)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {Object.entries(SERVERS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div className="w-px h-6" style={{ backgroundColor: 'rgba(124, 58, 237, 0.2)' }} />

            {/* Max age */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                Max Age
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={maxAgeHours}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v >= 0) setMaxAgeHours(v);
                }}
                className={inputClass + " w-16 text-right"}
                style={{
                  backgroundColor: 'rgba(124, 58, 237, 0.08)',
                  borderColor: 'rgba(124, 58, 237, 0.2)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>hrs</span>
            </div>

            {/* Divider */}
            <div className="w-px h-6" style={{ backgroundColor: 'rgba(124, 58, 237, 0.2)' }} />

            {/* Refresh — neon gradient button */}
            <motion.button
              onClick={onRefresh}
              disabled={loading}
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(124, 58, 237, 0.4), 0 0 60px rgba(244, 63, 94, 0.2)' }}
              whileTap={{ scale: 0.96 }}
              className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #F43F5E)',
                color: '#fff',
                boxShadow: '0 0 20px rgba(124, 58, 237, 0.3), 0 4px 16px rgba(0, 0, 0, 0.3)',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
                  />
                  Loading...
                </span>
              ) : 'Refresh Prices'}
            </motion.button>

            {overrideCount > 0 && (
              <motion.button
                onClick={onClearOverrides}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="border px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  borderColor: 'rgba(192, 132, 252, 0.4)',
                  color: 'var(--color-override)',
                  backgroundColor: 'rgba(192, 132, 252, 0.08)',
                  boxShadow: '0 0 12px rgba(192, 132, 252, 0.1)',
                }}
              >
                {overrideCount} Override{overrideCount > 1 ? 's' : ''} - Clear
              </motion.button>
            )}
          </div>
        </div>

        {/* Status line */}
        <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {lastFetched && (
            <span className="flex items-center gap-1.5">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              Last updated: {lastFetched.toLocaleTimeString()}
            </span>
          )}
          {error && <span style={{ color: 'var(--color-loss)' }}>Error: {error}</span>}
        </div>
      </div>
    </motion.header>
  );
}
