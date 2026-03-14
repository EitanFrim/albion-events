'use client'

import { useState, useEffect } from 'react';
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
    <div className="border rounded-xl overflow-hidden px-5 py-4" style={{
      backgroundColor: 'var(--color-surface-2)',
      borderColor: 'var(--color-border)',
    }}>
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
            Buy From
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => tbc(city)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${bc.has(city) ? 'ring-1' : 'hover:opacity-80'}`}
                style={bc.has(city) ? {
                  backgroundColor: hexToRgba(getCityColor(city) || '#34d399', 0.2),
                  color: getCityColor(city) || '#34d399',
                  boxShadow: `inset 0 0 0 1px ${hexToRgba(getCityColor(city) || '#34d399', 0.4)}`,
                } : {
                  backgroundColor: 'var(--color-surface-3)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {city.replace('Fort Sterling', 'Ft. Sterling')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
            Sell In
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => tsc(city)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${sc.has(city) ? 'ring-1' : 'hover:opacity-80'}`}
                style={sc.has(city) ? {
                  backgroundColor: hexToRgba(getCityColor(city) || '#34d399', 0.2),
                  color: getCityColor(city) || '#34d399',
                  boxShadow: `inset 0 0 0 1px ${hexToRgba(getCityColor(city) || '#34d399', 0.4)}`,
                } : {
                  backgroundColor: 'var(--color-surface-3)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {city.replace('Fort Sterling', 'Ft. Sterling')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="crafting-root min-h-screen" style={{ backgroundColor: 'var(--color-surface-0)' }}>
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

      <main className="max-w-[1600px] mx-auto px-8 py-8 space-y-6">
        <SettingsPanel settings={settings} onChange={handleSettingsChange} />

        {/* Resource type selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            Resource
          </span>
          <div className="inline-flex rounded-lg p-1 border" style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border-subtle)',
          }}>
            {RESOURCE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleResourceChange(type)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  resourceType === type ? 'shadow-sm' : 'hover:opacity-80'
                }`}
                style={resourceType === type ? {
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: 'var(--color-accent)',
                  boxShadow: 'inset 0 0 0 1px rgba(245, 158, 11, 0.25)',
                } : {
                  color: 'var(--color-text-muted)',
                }}
              >
                {RESOURCES[type].label}
              </button>
            ))}
          </div>
        </div>

        {/* Refining / Transmutation tabs */}
        <div className="inline-flex rounded-lg p-1 border" style={{
          backgroundColor: 'var(--color-surface-2)',
          borderColor: 'var(--color-border-subtle)',
        }}>
          <button
            onClick={() => setActiveTab('refining')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'refining'
                ? 'shadow-sm'
                : 'hover:opacity-80'
            }`}
            style={activeTab === 'refining' ? {
              backgroundColor: 'var(--color-surface-3)',
              color: 'var(--color-text-primary)',
            } : {
              color: 'var(--color-text-tertiary)',
            }}
          >
            Refining
            <span className="ml-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>{recipes.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('transmutation')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'transmutation'
                ? 'shadow-sm'
                : 'hover:opacity-80'
            }`}
            style={activeTab === 'transmutation' ? {
              backgroundColor: 'var(--color-surface-3)',
              color: 'var(--color-text-primary)',
            } : {
              color: 'var(--color-text-tertiary)',
            }}
          >
            Transmutation
            <span className="ml-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>{transmutations.length}</span>
          </button>
        </div>

        {/* City selection */}
        <CitySelector
          buyCities={buyCities}
          toggleBuyCity={toggleBuyCity}
          sellCities={sellCities}
          toggleSellCity={toggleSellCity}
        />

        <div
          key={`${activeTab}-${resourceType}`}
          style={{ animation: 'fadeIn 0.25s ease-out' }}
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
        </div>
      </main>
    </div>
  );
}
