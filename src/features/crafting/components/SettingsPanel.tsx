'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Settings, SpecLevels } from '../utils/calculations';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (s: Settings) => void;
}

const inputClass = "border rounded-lg px-3 py-1.5 text-sm w-full text-right focus:outline-none transition-all duration-200";

function NeonToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-9 h-5 rounded-full transition-all duration-300 flex-shrink-0 cursor-pointer"
      style={{
        backgroundColor: enabled ? 'var(--color-accent)' : 'var(--color-surface-3)',
        boxShadow: enabled ? '0 0 12px rgba(124, 58, 237, 0.4)' : 'none',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200"
        style={{
          backgroundColor: 'var(--color-text-primary)',
          transform: enabled ? 'translateX(16px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const update = (key: keyof Settings, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onChange({ ...settings, [key]: num });
    }
  };

  return (
    <div className="glass-panel overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left transition-colors hover:opacity-90 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(124, 58, 237, 0.15)' }}>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
              style={{ color: 'var(--color-accent-hover)' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>
        </div>
        {!isOpen && (
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Return {settings.returnRateNoFocus}% / {settings.returnRateWithFocus}%
            &nbsp;&middot;&nbsp; Nutrition {settings.nutritionPricePer100}
            &nbsp;&middot;&nbsp; {settings.useSellNow ? 'Sell Instantly' : `Markdown ${settings.sellMarkdown}%`}
            {settings.useBuyOrders && (
              <>
                &nbsp;&middot;&nbsp; Buy Orders
              </>
            )}
            {settings.specLevels.some(s => s > 0) && (
              <>
                &nbsp;&middot;&nbsp; Specs {settings.specLevels.join('/')}
              </>
            )}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
        <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pt-4">
            <SettingField
              label="Return Rate (No Focus)"
              value={settings.returnRateNoFocus}
              step="0.1"
              unit="%"
              onChange={(v) => update('returnRateNoFocus', v)}
            />
            <SettingField
              label="Return Rate (Focus)"
              value={settings.returnRateWithFocus}
              step="0.1"
              unit="%"
              onChange={(v) => update('returnRateWithFocus', v)}
            />
            <SettingField
              label="Nutrition Cost / 100"
              value={settings.nutritionPricePer100}
              step="1"
              onChange={(v) => update('nutritionPricePer100', v)}
            />
            <div style={{ opacity: settings.useSellNow ? 0.4 : 1, pointerEvents: settings.useSellNow ? 'none' : undefined }}>
              <SettingField
                label="Sell Markdown"
                value={settings.sellMarkdown}
                step="0.5"
                unit="%"
                onChange={(v) => update('sellMarkdown', v)}
              />
            </div>
          </div>

          {/* Toggle section */}
          <div className="space-y-0">
            <ToggleRow
              label="Buy via Buy Orders"
              description="Use highest buy order price instead of cheapest sell order for material costs"
              enabled={settings.useBuyOrders}
              onToggle={() => onChange({ ...settings, useBuyOrders: !settings.useBuyOrders })}
            />
            <ToggleRow
              label="Sell Instantly"
              description="Sell to highest buy order instead of listing a sell order (4% market tax applied)"
              enabled={settings.useSellNow}
              onToggle={() => onChange({ ...settings, useSellNow: !settings.useSellNow })}
            />
            <ToggleRow
              label="Cheaper via Transmute"
              description="Show when transmuting a resource before refining is cheaper"
              enabled={settings.enableTransmute}
              onToggle={() => onChange({ ...settings, enableTransmute: !settings.enableTransmute })}
            />
            <ToggleRow
              label="Show Materials"
              description="Split material cost into individual ingredient columns"
              enabled={settings.showMaterials}
              onToggle={() => onChange({ ...settings, showMaterials: !settings.showMaterials })}
            />
          </div>

          {/* Specialization levels */}
          <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Specialization Levels
                </div>
                <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Reduces focus cost per craft. Set your spec for each tier (0–100).
                </div>
              </div>
              {settings.specLevels.some(s => s > 0) && (
                <button
                  onClick={() => onChange({ ...settings, specLevels: [0, 0, 0, 0, 0] })}
                  className="text-[10px] px-2 py-1 rounded-md transition-colors hover:opacity-80 cursor-pointer"
                  style={{ color: 'var(--color-accent-hover)', backgroundColor: 'rgba(124, 58, 237, 0.1)' }}
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-3">
              {([4, 5, 6, 7, 8] as const).map((tier, i) => (
                <div key={tier} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                    T{tier}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={settings.specLevels[i]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (isNaN(val)) return;
                      const clamped = Math.max(0, Math.min(100, val));
                      const next = [...settings.specLevels] as SpecLevels;
                      next[i] = clamped;
                      onChange({ ...settings, specLevels: next });
                    }}
                    className={inputClass + " text-center"}
                    style={{
                      backgroundColor: 'rgba(124, 58, 237, 0.08)',
                      borderColor: 'rgba(124, 58, 237, 0.2)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToggleRow({ label, description, enabled, onToggle }: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 pt-4 mt-4 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
      <NeonToggle enabled={enabled} onToggle={onToggle} />
      <div>
        <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </div>
        <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </div>
      </div>
    </div>
  );
}

function SettingField({
  label, value, step, unit, onChange,
}: {
  label: string;
  value: number;
  step: string;
  unit?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          style={{
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
            borderColor: 'rgba(124, 58, 237, 0.2)',
            color: 'var(--color-text-primary)',
          }}
        />
        {unit && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{unit}</span>}
      </div>
    </div>
  );
}
