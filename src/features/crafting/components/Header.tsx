'use client'

import { motion } from 'framer-motion';
import { SERVERS, type ServerKey } from '../data/items';

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

const inputClass = "border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2";

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
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      className="border-b px-8 py-5 sticky top-0 z-40 backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(12, 12, 18, 0.8)',
        borderColor: 'rgba(255,255,255,0.06)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
      <div className="max-w-[1600px] mx-auto">
        {/* Top row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-surface-3)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <img src="/images/branding/logo.png" alt="" className="w-4 h-4 object-contain" />
              AlbionHQ
            </a>
            <div>
              <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                Albion Refiner
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
                  backgroundColor: 'var(--color-surface-3)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {Object.entries(SERVERS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

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
                  backgroundColor: 'var(--color-surface-3)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>hrs</span>
            </div>

            {/* Divider */}
            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Refresh */}
            <motion.button
              onClick={onRefresh}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors accent-glow"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: '#0a0a0f',
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
              <button
                onClick={onClearOverrides}
                className="border px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:opacity-80"
                style={{
                  borderColor: 'color-mix(in srgb, var(--color-override) 40%, transparent)',
                  color: 'var(--color-override)',
                }}
              >
                {overrideCount} Override{overrideCount > 1 ? 's' : ''} - Clear
              </button>
            )}
          </div>
        </div>

        {/* Status line */}
        <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {lastFetched && (
            <span>Last updated: {lastFetched.toLocaleTimeString()}</span>
          )}
          {error && <span style={{ color: 'var(--color-loss)' }}>Error: {error}</span>}
        </div>
      </div>
    </motion.header>
  );
}
