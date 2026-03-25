'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import RefiningTable from './components/RefiningTable';
import TransmutationTable from './components/TransmutationTable';
import { usePrices } from './hooks/usePrices';
import { DEFAULT_SETTINGS, type Settings } from './utils/calculations';
import { RESOURCE_TYPES, RESOURCES, CITIES, type ResourceType, type City, getCityColor } from './data/items';
import { RECIPES_BY_RESOURCE } from './data/recipes';
import { TRANSMUTATIONS_BY_RESOURCE } from './data/transmutations';
import { preloadAllIcons } from './components/ItemIcon';
import { transitions } from '@/lib/animations';
import { GridBackground } from '@/components/backgrounds/GridBackground';
import { ParticleField } from '@/components/backgrounds/ParticleField';

const SETTINGS_KEY = 'albion-refiner-settings';
const RESOURCE_KEY = 'albion-refiner-resource';

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadResourceType(): ResourceType {
  try {
    const stored = localStorage.getItem(RESOURCE_KEY);
    if (stored && RESOURCE_TYPES.includes(stored as ResourceType)) return stored as ResourceType;
  } catch { /* ignore */ }
  return 'wood';
}

/* ── Neon Sliding Tab ── */
function NeonTabs<T extends string>({
  items,
  activeItem,
  onSelect,
  layoutId,
  renderLabel,
}: {
  items: readonly T[];
  activeItem: T;
  onSelect: (item: T) => void;
  layoutId: string;
  renderLabel: (item: T, active: boolean) => React.ReactNode;
}) {
  return (
    <div
      className="inline-flex rounded-xl p-1 border backdrop-blur-sm"
      style={{
        backgroundColor: 'rgba(124, 58, 237, 0.06)',
        borderColor: 'rgba(124, 58, 237, 0.12)',
      }}
    >
      {items.map((item) => {
        const isActive = activeItem === item;
        return (
          <button
            key={item}
            onClick={() => onSelect(item)}
            className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              !isActive ? 'hover:opacity-80' : ''
            }`}
            style={{ color: isActive ? '#e9d5ff' : 'var(--color-text-muted)' }}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg neon-tab-glow"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            {/* Top neon line on active tab */}
            {isActive && (
              <motion.div
                layoutId={`${layoutId}-line`}
                className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #7C3AED, #F43F5E)',
                  boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{renderLabel(item, isActive)}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [activeTab, setActiveTab] = useState<'refining' | 'transmutation'>('refining');
  const [resourceType, setResourceType] = useState<ResourceType>(loadResourceType);

  useEffect(() => { preloadAllIcons(); }, []);

  const {
    getBuyPrice,
    getBuyPriceInfo,
    getSellPrice,
    getSellPriceInfo,
    getAllBuyPrices,
    setOverride,
    clearOverride,
    clearAllOverrides,
    server,
    setServer,
    buyCities,
    toggleBuyCity,
    sellCities,
    toggleSellCity,
    maxAgeHours,
    setMaxAgeHours,
    loading,
    error,
    lastFetched,
    refresh,
    overrides,
  } = usePrices({ useBuyOrders: settings.useBuyOrders, useSellNow: settings.useSellNow });

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handleResourceChange = (type: ResourceType) => {
    setResourceType(type);
    localStorage.setItem(RESOURCE_KEY, type);
  };

  const overrideCount = Object.keys(overrides).length;
  const recipes = RECIPES_BY_RESOURCE[resourceType];
  const transmutations = TRANSMUTATIONS_BY_RESOURCE[resourceType];

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const CitySelector = ({ buyCities: bc, toggleBuyCity: tbc, sellCities: sc, toggleSellCity: tsc }: {
    buyCities: Set<City>; toggleBuyCity: (c: City) => void;
    sellCities: Set<City>; toggleSellCity: (c: City) => void;
  }) => (
    <motion.div
      className="glass-panel glass-panel-animated px-5 py-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitions.smooth, delay: 0.2 }}
    >
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
            Buy From
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {CITIES.map((city) => (
              <motion.button
                key={city}
                onClick={() => tbc(city)}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${bc.has(city) ? 'ring-1' : 'hover:opacity-80'}`}
                style={bc.has(city) ? {
                  backgroundColor: hexToRgba(getCityColor(city) || '#34d399', 0.15),
                  color: getCityColor(city) || '#34d399',
                  boxShadow: `inset 0 0 0 1px ${hexToRgba(getCityColor(city) || '#34d399', 0.3)}, 0 0 12px ${hexToRgba(getCityColor(city) || '#34d399', 0.15)}`,
                } : {
                  backgroundColor: 'var(--color-surface-3)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {city.replace('Fort Sterling', 'Ft. Sterling')}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
            Sell In
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {CITIES.map((city) => (
              <motion.button
                key={city}
                onClick={() => tsc(city)}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${sc.has(city) ? 'ring-1' : 'hover:opacity-80'}`}
                style={sc.has(city) ? {
                  backgroundColor: hexToRgba(getCityColor(city) || '#34d399', 0.15),
                  color: getCityColor(city) || '#34d399',
                  boxShadow: `inset 0 0 0 1px ${hexToRgba(getCityColor(city) || '#34d399', 0.3)}, 0 0 12px ${hexToRgba(getCityColor(city) || '#34d399', 0.15)}`,
                } : {
                  backgroundColor: 'var(--color-surface-3)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {city.replace('Fort Sterling', 'Ft. Sterling')}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      className="crafting-root min-h-screen"
      style={{ backgroundColor: 'var(--color-surface-0)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={transitions.smooth}
    >
      {/* ── 3D Background layers ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Animated grid with scan line */}
        <GridBackground />

        {/* Floating particles */}
        <ParticleField count={30} />

        {/* Ambient glow orbs */}
        <motion.div
          className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full bg-purple-600/[0.05] blur-[150px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-rose-500/[0.04] blur-[130px]"
          animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-cyan-500/[0.03] blur-[100px]"
          animate={{ x: [0, 20, 0], y: [0, -25, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,#0F0F23_100%)]" />
      </div>

      {/* CRT Scanline overlay */}
      <div className="crt-scanlines" />

      <Header
        server={server}
        setServer={setServer}
        maxAgeHours={maxAgeHours}
        setMaxAgeHours={setMaxAgeHours}
        loading={loading}
        error={error}
        lastFetched={lastFetched}
        onRefresh={refresh}
        overrideCount={overrideCount}
        onClearOverrides={clearAllOverrides}
      />

      <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-8 space-y-6">
        {/* Settings with entrance animation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.smooth, delay: 0.05 }}
        >
          <SettingsPanel settings={settings} onChange={handleSettingsChange} />
        </motion.div>

        {/* Resource type selector — neon sliding tabs */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.smooth, delay: 0.1 }}
        >
          <span className="text-xs font-medium uppercase tracking-widest neon-text" style={{ color: 'var(--color-accent-hover)' }}>
            Resource
          </span>
          <NeonTabs
            items={RESOURCE_TYPES}
            activeItem={resourceType}
            onSelect={handleResourceChange}
            layoutId="resource-indicator"
            renderLabel={(type) => RESOURCES[type].label}
          />
        </motion.div>

        {/* Refining / Transmutation tabs — neon sliding tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.smooth, delay: 0.15 }}
        >
          <NeonTabs
            items={['refining', 'transmutation'] as const}
            activeItem={activeTab}
            onSelect={setActiveTab}
            layoutId="tab-indicator"
            renderLabel={(tab) => (
              <>
                {tab === 'refining' ? 'Refining' : 'Transmutation'}
                <span className="ml-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {tab === 'refining' ? recipes.length : transmutations.length}
                </span>
              </>
            )}
          />
        </motion.div>

        {/* City selection */}
        <CitySelector
          buyCities={buyCities}
          toggleBuyCity={toggleBuyCity}
          sellCities={sellCities}
          toggleSellCity={toggleSellCity}
        />

        {/* Data table with animated transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${resourceType}`}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ ...transitions.quick, duration: 0.25 }}
          >
            {activeTab === 'refining' ? (
              <RefiningTable
                recipes={recipes}
                transmutations={transmutations}
                getBuyPrice={getBuyPrice}
                getBuyPriceInfo={getBuyPriceInfo}
                getSellPrice={getSellPrice}
                getSellPriceInfo={getSellPriceInfo}
                getAllBuyPrices={getAllBuyPrices}
                settings={settings}
                onOverride={setOverride}
                onClearOverride={clearOverride}
                overrides={overrides}
              />
            ) : (
              <TransmutationTable
                transmutations={transmutations}
                getBuyPrice={getBuyPrice}
                getBuyPriceInfo={getBuyPriceInfo}
                getSellPrice={getSellPrice}
                getSellPriceInfo={getSellPriceInfo}
                onOverride={setOverride}
                onClearOverride={clearOverride}
                overrides={overrides}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
