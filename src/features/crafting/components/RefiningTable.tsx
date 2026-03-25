'use client'

import { useState, useMemo, useRef, useEffect, useLayoutEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { type Recipe } from '../data/recipes';
import { type Transmutation } from '../data/transmutations';
import { calculateRefine, calculateRefineWithTransmute, formatSilver, type Settings, type RefineResultWithTransmute, type TransmuteAltResult, type TransmuteAlternative } from '../utils/calculations';
import { getCityColor } from '../data/items';
import PriceCell from './PriceCell';
import ItemIcon from './ItemIcon';

type SortKey = 'tier' | 'profitNoFocus' | 'profitWithFocus' | 'focusEfficiency';

interface RefiningTableProps {
  recipes: Recipe[];
  transmutations: Transmutation[];
  getBuyPrice: (itemId: string) => number;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  getSellPrice: (itemId: string) => number;
  getSellPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  getAllBuyPrices: (itemId: string) => { price: number; city: string; date: string }[];
  settings: Settings;
  onOverride: (itemId: string, price: number) => void;
  onClearOverride: (itemId: string) => void;
  overrides: Record<string, number>;
}

const TIERS = [4, 5, 6, 7, 8] as const;
const ENCHANTS = [0, 1, 2, 3, 4] as const;

const profitColor = (val: number) =>
  val > 0 ? 'var(--color-profit)' : val < 0 ? 'var(--color-loss)' : 'var(--color-text-muted)';

// When a cheaper transmute path exists, use its adjusted values
const effectiveProfitNoFocus = (r: RefineResultWithTransmute) =>
  r.transmuteAlt ? r.transmuteAlt.adjustedProfitNoFocus : r.profitNoFocus;
const effectiveProfitWithFocus = (r: RefineResultWithTransmute) =>
  r.transmuteAlt ? r.transmuteAlt.adjustedProfitWithFocus : r.profitWithFocus;

/* ─── Info Icon (reused across all popover triggers) ─── */

const InfoIcon = () => (
  <svg
    className="w-3.5 h-3.5 flex-shrink-0 opacity-40"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
  </svg>
);

/* ─── Reusable Hover Popover ─── */

function HoverPopover({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.right;
    const popoverHeight = popoverRef.current?.offsetHeight ?? 300;
    if (top + popoverHeight > window.innerHeight && rect.top - popoverHeight - 6 > 0) {
      top = rect.top - popoverHeight - 6;
    }
    setPos({ top, left });
  }, [open]);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  return (
    <div ref={triggerRef} className="inline-flex" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {trigger}
      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-50 border rounded-xl shadow-xl p-4 min-w-[240px] backdrop-blur-2xl"
          style={{
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            transform: 'translateX(-100%)',
            backgroundColor: 'rgba(15, 15, 40, 0.92)',
            borderColor: 'rgba(124, 58, 237, 0.2)',
            boxShadow: '0 20px 40px -5px rgba(0,0,0,0.5), 0 0 30px rgba(124, 58, 237, 0.1), inset 0 1px 0 rgba(124, 58, 237, 0.06)',
            visibility: pos ? 'visible' : 'hidden',
          }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ─── Popover Row helper ─── */

function PopoverRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="tabular-nums font-medium" style={{ color: accent ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Main Table ─── */

export default function RefiningTable({
  recipes,
  transmutations,
  getBuyPrice,
  getBuyPriceInfo,
  getSellPrice,
  getSellPriceInfo,
  getAllBuyPrices,
  settings,
  onOverride,
  onClearOverride,
  overrides,
}: RefiningTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('tier');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterTiers, setFilterTiers] = useState<Set<number>>(new Set(TIERS));
  const [filterEnchants, setFilterEnchants] = useState<Set<number>>(new Set(ENCHANTS));
  const [quantity, setQuantity] = useState(1);

  const isSellOverride = useMemo(() => {
    return (itemId: string) => getSellPriceInfo(itemId).isOverride;
  }, [getSellPriceInfo]);

  const results = useMemo(() => {
    if (settings.enableTransmute) {
      return recipes.map((recipe) => calculateRefineWithTransmute(recipe, getBuyPrice, getSellPrice, settings, transmutations, isSellOverride));
    }
    return recipes.map((recipe) => ({ ...calculateRefine(recipe, getBuyPrice, getSellPrice, settings, isSellOverride), transmuteAlt: null }) as RefineResultWithTransmute);
  }, [recipes, getBuyPrice, getSellPrice, settings, transmutations, isSellOverride]);

  const filtered = useMemo(() => {
    return results.filter(
      (r) => filterTiers.has(r.recipe.tier) && filterEnchants.has(r.recipe.enchant)
    );
  }, [results, filterTiers, filterEnchants]);

  // Check if any filtered recipe uses hearts (for showMaterials column)
  const hasHearts = useMemo(() => {
    return filtered.some((r) => r.recipe.inputs.length > 2);
  }, [filtered]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case 'tier':
          va = a.recipe.tier * 10 + a.recipe.enchant;
          vb = b.recipe.tier * 10 + b.recipe.enchant;
          break;
        case 'profitNoFocus':
          va = effectiveProfitNoFocus(a);
          vb = effectiveProfitNoFocus(b);
          break;
        case 'profitWithFocus':
          va = effectiveProfitWithFocus(a);
          vb = effectiveProfitWithFocus(b);
          break;
        case 'focusEfficiency':
          va = a.actualFocusCost > 0 ? Math.round(effectiveProfitWithFocus(a) / a.actualFocusCost) : 0;
          vb = b.actualFocusCost > 0 ? Math.round(effectiveProfitWithFocus(b) / b.actualFocusCost) : 0;
          break;
      }
      return sortAsc ? va - vb : vb - va;
    });
    return arr;
  }, [filtered, sortKey, sortAsc]);

  const bestProfit = useMemo(() => {
    const complete = filtered.filter((r) => !r.incomplete);
    if (complete.length === 0) return 0;
    return Math.max(...complete.map((r) => effectiveProfitWithFocus(r)));
  }, [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIcon = (key: SortKey): ReactNode => {
    if (sortKey !== key) return null;
    return (
      <span className="ml-1" style={{ color: 'var(--color-accent)' }}>
        {sortAsc ? '↑' : '↓'}
      </span>
    );
  };

  const toggleFilter = (set: Set<number>, value: number, setter: (s: Set<number>) => void) => {
    const next = new Set(set);
    if (next.has(value)) {
      if (next.size > 1) next.delete(value);
    } else {
      next.add(value);
    }
    setter(next);
  };

  const thClass = "px-2 py-3 text-sm font-medium uppercase tracking-wider select-none whitespace-nowrap";
  const thSortable = thClass + " cursor-pointer transition-colors";

  // Dynamic column count for colSpan
  const materialColCount = settings.showMaterials ? (hasHearts ? 3 : 2) : 1;
  const totalCols = 1 + materialColCount + 6; // product + materials + estCost + productPrice + sellPrice + profitNoFocus + profitFocus + focusEff

  return (
    <div className="glass-panel overflow-hidden">
      {/* Filter header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Refining Profits
          </h2>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {sorted.length} recipes
          </span>
        </div>

        <div className="flex flex-wrap gap-6">
          {/* Tier filter */}
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Tier
            </span>
            <div className="inline-flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--color-surface-0)' }}>
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleFilter(filterTiers, t, setFilterTiers)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filterTiers.has(t) ? 'ring-1' : 'hover:opacity-80'
                  }`}
                  style={filterTiers.has(t) ? {
                    backgroundColor: 'rgba(124, 58, 237, 0.15)',
                    color: 'var(--color-accent)',
                    boxShadow: 'inset 0 0 0 1px rgba(124, 58, 237, 0.3)',
                  } : {
                    color: 'var(--color-text-muted)',
                  }}
                >
                  T{t}
                </button>
              ))}
            </div>
          </div>

          {/* Enchant filter */}
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Enchant
            </span>
            <div className="inline-flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--color-surface-0)' }}>
              {ENCHANTS.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleFilter(filterEnchants, e, setFilterEnchants)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filterEnchants.has(e) ? 'ring-1' : 'hover:opacity-80'
                  }`}
                  style={filterEnchants.has(e) ? {
                    backgroundColor: 'rgba(124, 58, 237, 0.15)',
                    color: 'var(--color-accent)',
                    boxShadow: 'inset 0 0 0 1px rgba(124, 58, 237, 0.3)',
                  } : {
                    color: 'var(--color-text-muted)',
                  }}
                >
                  .{e}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity multiplier */}
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Qty
            </span>
            <input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 1) setQuantity(v);
              }}
              className="border rounded-md px-2 py-1.5 text-sm w-16 text-right focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-surface-3)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <table className="w-full text-base">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
              <th className={thSortable + " text-left"} onClick={() => toggleSort('tier')}>
                Product{sortIcon('tier')}
              </th>
              {settings.showMaterials ? (
                <>
                  <th className={thClass + " text-right"}>Raw</th>
                  {hasHearts && <th className={thClass + " text-right"}>Heart</th>}
                  <th className={thClass + " text-right"}>Refined</th>
                </>
              ) : (
                <th className={thClass + " text-right"}>Material Cost</th>
              )}
              <th className={thClass + " text-right"}>Est. Cost</th>
              <th className={thClass + " text-right"}>Product Price</th>
              <th className={thClass + " text-right"}>
                {settings.useSellNow ? 'Sell (-4%)' : `Sell (-${settings.sellMarkdown}%)`}
              </th>
              <th className={thSortable + " text-right"} onClick={() => toggleSort('profitNoFocus')}>
                No Focus{sortIcon('profitNoFocus')}
              </th>
              <th className={thSortable + " text-right"} onClick={() => toggleSort('profitWithFocus')}>
                Focus{sortIcon('profitWithFocus')}
              </th>
              <th className={thSortable + " text-right"} onClick={() => toggleSort('focusEfficiency')}>
                Focus Eff.{sortIcon('focusEfficiency')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="px-4 py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  No recipes match the selected filters.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <RefiningRow
                  key={r.recipe.id}
                  result={r}
                  isBest={!r.incomplete && effectiveProfitWithFocus(r) === bestProfit && bestProfit > 0}
                  quantity={quantity}
                  settings={settings}
                  hasHearts={hasHearts}
                  getBuyPriceInfo={getBuyPriceInfo}
                  getSellPriceInfo={getSellPriceInfo}
                  getAllBuyPrices={getAllBuyPrices}
                  onOverride={onOverride}
                  onClearOverride={onClearOverride}
                  overrides={overrides}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Material Cost Tooltip (existing, refactored to use HoverPopover) ─── */

function MaterialCostTooltip({
  result,
  getBuyPriceInfo,
  onOverride,
  onClearOverride,
}: {
  result: RefineResultWithTransmute;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  onOverride: (itemId: string, price: number) => void;
  onClearOverride: (itemId: string) => void;
}) {
  const { recipe } = result;

  const hasMissingInput = recipe.inputs.some(
    (inp) => getBuyPriceInfo(inp.itemId).price === 0
  );

  const trigger = (
    <span className="inline-flex flex-col items-end">
      <span
        className="tabular-nums cursor-default flex items-center gap-1 transition-colors"
        style={{ color: result.transmuteAlt ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
      >
        {result.transmuteAlt && (
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        )}
        {formatSilver(Math.round(result.transmuteAlt ? result.transmuteAlt.adjustedMaterialCost : result.materialCost))}
        <InfoIcon />
      </span>
      {hasMissingInput && (
        <span className="text-[10px] italic" style={{ color: 'var(--color-loss)' }}>
          Incomplete
        </span>
      )}
    </span>
  );

  return (
    <HoverPopover trigger={trigger}>
      <div className="min-w-[280px]">
        <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Material Breakdown
        </div>

        <div className="flex flex-col gap-2">
          {recipe.inputs.map((inp, i) => {
            const info = getBuyPriceInfo(inp.itemId);
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5"
                style={{ backgroundColor: 'var(--color-surface-2)' }}
              >
                <ItemIcon itemId={inp.itemId} size={24} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {inp.label}
                  </div>
                  <span
                    className="text-[11px] inline-block px-1 py-0.5 rounded font-medium"
                    style={getCityColor(info.city) ? {
                      backgroundColor: getCityColor(info.city),
                      color: '#111',
                    } : {
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {info.city !== 'N/A' ? info.city : 'No data'}
                  </span>
                </div>
                <div className="text-[11px] whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                  {inp.quantity}x
                </div>
                <div className="text-right">
                  <PriceCell
                    itemId={inp.itemId}
                    price={info.price}
                    city={info.city}
                    isOverride={info.isOverride}
                    onOverride={onOverride}
                    onClearOverride={onClearOverride}
                    hideCity
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Total
          </span>
          <span className="text-sm tabular-nums font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {formatSilver(Math.round(result.materialCost))}
          </span>
        </div>

        {result.transmuteAlt && (
          <TransmuteAltSection
            transmuteAlt={result.transmuteAlt}
            getBuyPriceInfo={getBuyPriceInfo}
          />
        )}
      </div>
    </HoverPopover>
  );
}

/* ─── Transmute Path Display (reused in tooltips and popovers) ─── */

function TransmutePathDisplay({ alternative, getBuyPriceInfo }: {
  alternative: TransmuteAlternative;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
}) {
  const sourceInfo = getBuyPriceInfo(alternative.sourceItemId);

  return (
    <>
      {/* Path visualization */}
      <div
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 mb-1.5 flex-wrap"
        style={{ backgroundColor: 'rgba(124, 58, 237, 0.08)' }}
      >
        <ItemIcon itemId={alternative.steps[0].fromId} size={20} />
        <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
          {alternative.steps[0].fromLabel}
        </span>
        {alternative.steps.map((step, i) => (
          <span key={i} className="contents">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <ItemIcon itemId={step.toId} size={20} />
            <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
              {step.toLabel}
            </span>
          </span>
        ))}
      </div>

      {/* Cost breakdown */}
      <div className="flex flex-col gap-1 text-xs px-1">
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Source price</span>
          <span className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
            {formatSilver(alternative.sourceBuyPrice)}
            {sourceInfo.city !== 'N/A' && (
              <span className="ml-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>({sourceInfo.city})</span>
            )}
          </span>
        </div>
        {alternative.steps.length > 1 ? (
          <>
            {alternative.steps.map((step, i) => (
              <div key={i} className="flex justify-between">
                <span style={{ color: 'var(--color-text-muted)' }}>
                  Step {i + 1} cost
                </span>
                <span className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>{formatSilver(step.transmuteCost)}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-muted)' }}>Total transmute</span>
              <span className="tabular-nums font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatSilver(alternative.totalTransmuteCost)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-muted)' }}>Transmute cost</span>
            <span className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>{formatSilver(alternative.totalTransmuteCost)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Cost per unit</span>
          <span className="tabular-nums font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatSilver(alternative.costPerUnit)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Direct buy price</span>
          <span className="tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>{formatSilver(alternative.directBuyPrice)}</span>
        </div>
      </div>
    </>
  );
}

/* ─── Transmute Alternative Section (inside material cost tooltip) ─── */

function TransmuteAltSection({
  transmuteAlt,
  getBuyPriceInfo,
}: {
  transmuteAlt: TransmuteAltResult;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
}) {
  const { alternative, quantity, totalSavings, adjustedMaterialCost } = transmuteAlt;

  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
          Cheaper via Transmute{alternative.steps.length > 1 ? ` (${alternative.steps.length} steps)` : ''}
        </span>
      </div>

      <TransmutePathDisplay alternative={alternative} getBuyPriceInfo={getBuyPriceInfo} />

      <div className="flex items-center justify-between mt-2 pt-1.5 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Save ({quantity}x)
        </span>
        <span className="text-sm tabular-nums font-semibold" style={{ color: 'var(--color-profit)' }}>
          -{formatSilver(Math.round(totalSavings))}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Adjusted Total
        </span>
        <span className="text-sm tabular-nums font-semibold" style={{ color: 'var(--color-accent)' }}>
          {formatSilver(Math.round(adjustedMaterialCost))}
        </span>
      </div>
    </div>
  );
}

/* ─── Material Input Cell (for showMaterials mode) ─── */

function MaterialInputCell({
  itemId,
  quantity: qty,
  getBuyPriceInfo,
  getAllBuyPrices,
  onOverride,
  onClearOverride,
  transmuteAlternative,
}: {
  itemId: string;
  quantity: number;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  getAllBuyPrices: (itemId: string) => { price: number; city: string; date: string }[];
  onOverride: (itemId: string, price: number) => void;
  onClearOverride: (itemId: string) => void;
  transmuteAlternative?: TransmuteAlternative;
}) {
  const info = getBuyPriceInfo(itemId);
  const allPrices = getAllBuyPrices(itemId);

  // When transmutation is cheaper, show the transmuted cost as the main price
  const isTransmuted = !!transmuteAlternative;
  const displayPrice = isTransmuted ? transmuteAlternative.costPerUnit : info.price;
  const sourceInfo = isTransmuted ? getBuyPriceInfo(transmuteAlternative.sourceItemId) : null;
  const displayCity = isTransmuted ? (sourceInfo?.city ?? 'N/A') : info.city;

  const cityBadgeStyle = getCityColor(displayCity)
    ? { backgroundColor: getCityColor(displayCity), color: '#111' }
    : { color: 'var(--color-text-muted)' as const };

  const cityBadgeEl = (
    <span
      className="text-[10px] whitespace-nowrap w-[80px] text-center px-1.5 py-0.5 rounded font-medium"
      style={cityBadgeStyle}
    >
      {displayCity !== 'N/A' ? displayCity : '\u00A0'}
    </span>
  );

  return (
    <td className="px-3 py-2.5 text-right">
      <div className="flex items-center justify-end gap-2">
        {qty > 1 && (
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>×{qty}</span>
        )}
        <ItemIcon itemId={isTransmuted ? transmuteAlternative.sourceItemId : itemId} size={16} />
        <div className="inline-flex items-center gap-1">
          {isTransmuted && (
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          )}
          {isTransmuted ? (
            <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--color-accent)' }}>
              {formatSilver(Math.round(displayPrice))}
            </span>
          ) : (
            <PriceCell
              itemId={itemId}
              price={info.price}
              city={info.city}
              isOverride={info.isOverride}
              onOverride={onOverride}
              onClearOverride={onClearOverride}
              hideCity
            />
          )}
        </div>
        {allPrices.length > 1 || isTransmuted ? (
          <HoverPopover
            trigger={
              <span className="inline-flex items-center gap-0.5 cursor-default">
                {cityBadgeEl}
                <InfoIcon />
              </span>
            }
          >
            <div className="min-w-[220px]">
              {isTransmuted && (
                <>
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
                      Cheaper via Transmute{transmuteAlternative.steps.length > 1 ? ` (${transmuteAlternative.steps.length} steps)` : ''}
                    </span>
                  </div>
                  <TransmutePathDisplay alternative={transmuteAlternative} getBuyPriceInfo={getBuyPriceInfo} />
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      Savings per unit
                    </span>
                    <span className="text-sm tabular-nums font-semibold" style={{ color: 'var(--color-profit)' }}>
                      -{formatSilver(Math.round(transmuteAlternative.savingsPerUnit))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      Direct buy
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatSilver(transmuteAlternative.directBuyPrice)}
                    </span>
                  </div>
                  {qty > 1 && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                        Total ({qty}x)
                      </span>
                      <span className="text-sm tabular-nums font-semibold" style={{ color: 'var(--color-accent)' }}>
                        {formatSilver(Math.round(transmuteAlternative.costPerUnit * qty))}
                      </span>
                    </div>
                  )}
                </>
              )}
              {allPrices.length > 1 && (
                <div className={isTransmuted ? "mt-2 pt-2 border-t" : ""} style={isTransmuted ? { borderColor: 'var(--color-border-subtle)' } : {}}>
                  <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    {isTransmuted ? 'Direct Buy Prices' : 'Prices by City'}
                  </div>
                  <div className="flex flex-col gap-1">
                    {allPrices.map((p, i) => {
                      const isBest = i === 0 && !isTransmuted;
                      const cityColor = getCityColor(p.city);
                      return (
                        <div
                          key={p.city}
                          className="flex items-center justify-between gap-3 rounded-md px-2 py-1"
                          style={{
                            backgroundColor: isBest ? 'rgba(124, 58, 237, 0.08)' : 'var(--color-surface-2)',
                          }}
                        >
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium w-[80px] text-center"
                            style={cityColor ? {
                              backgroundColor: cityColor,
                              color: '#111',
                            } : {
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            {p.city}
                          </span>
                          <span
                            className="text-[11px] tabular-nums font-medium"
                            style={{ color: isBest ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
                          >
                            {formatSilver(p.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </HoverPopover>
        ) : (
          cityBadgeEl
        )}
      </div>
    </td>
  );
}

/* ─── Table Row ─── */

function RefiningRow({
  result,
  isBest,
  quantity,
  settings,
  hasHearts,
  getBuyPriceInfo,
  getSellPriceInfo,
  getAllBuyPrices,
  onOverride,
  onClearOverride,
  overrides,
}: {
  result: RefineResultWithTransmute;
  isBest: boolean;
  quantity: number;
  settings: Settings;
  hasHearts: boolean;
  getBuyPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  getSellPriceInfo: (itemId: string) => { price: number; city: string; date: string; isOverride: boolean };
  getAllBuyPrices: (itemId: string) => { price: number; city: string; date: string }[];
  onOverride: (itemId: string, price: number) => void;
  onClearOverride: (itemId: string) => void;
  overrides: Record<string, number>;
}) {
  const { recipe } = result;
  const productInfo = getSellPriceInfo(recipe.productId);

  // Sell price override: use `sell:productId` key to allow overriding the final sell price independently
  const sellKey = `sell:${recipe.productId}`;
  const hasSellOverride = overrides[sellKey] !== undefined;
  const effectiveSellPrice = hasSellOverride ? overrides[sellKey] : result.estimatedSellPrice;
  // When transmute alternative exists, use adjusted costs (cheaper materials)
  const costNoFocus = result.transmuteAlt
    ? (100 - settings.returnRateNoFocus) / 100 * result.transmuteAlt.adjustedMaterialCost + result.nutritionCost
    : result.effectiveCostNoFocus;
  const costWithFocus = result.transmuteAlt
    ? (100 - settings.returnRateWithFocus) / 100 * result.transmuteAlt.adjustedMaterialCost + result.nutritionCost
    : result.effectiveCostWithFocus;
  const displayProfitNoFocus = result.incomplete ? 0 : effectiveSellPrice - costNoFocus;
  const displayProfitWithFocus = result.incomplete ? 0 : effectiveSellPrice - costWithFocus;
  const matCost = result.transmuteAlt ? result.transmuteAlt.adjustedMaterialCost : result.materialCost;
  const estCostNoFocus = matCost * (100 - settings.returnRateNoFocus) / 100;
  const estCostWithFocus = matCost * (100 - settings.returnRateWithFocus) / 100;
  const estReturnNoFocus = matCost * settings.returnRateNoFocus / 100;
  const estReturnWithFocus = matCost * settings.returnRateWithFocus / 100;

  // Split inputs: raw = first, refined = last, heart = middle (if exists)
  const rawInput = recipe.inputs[0];
  const refinedInput = recipe.inputs[recipe.inputs.length - 1];
  const heartInput = recipe.inputs.length > 2 ? recipe.inputs[1] : null;

  return (
    <tr
      className="border-b transition-colors"
      style={{
        borderColor: 'var(--color-border-subtle)',
        backgroundColor: isBest ? 'rgba(124, 58, 237, 0.06)' : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isBest) e.currentTarget.style.backgroundColor = 'rgba(39, 39, 42, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isBest ? 'rgba(124, 58, 237, 0.06)' : '';
      }}
    >
      {/* Product name */}
      <td className="px-2 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
        <div className="flex items-center gap-2">
          <ItemIcon itemId={recipe.productId} size={36} />
          <span>{recipe.productLabel}</span>
        </div>
      </td>

      {/* Material columns */}
      {settings.showMaterials ? (
        <>
          <MaterialInputCell
            itemId={rawInput.itemId}
            quantity={rawInput.quantity}
            getBuyPriceInfo={getBuyPriceInfo}
            getAllBuyPrices={getAllBuyPrices}
            onOverride={onOverride}
            onClearOverride={onClearOverride}
            transmuteAlternative={result.transmuteAlt?.alternative}
          />
          {hasHearts && (
            heartInput ? (
              <MaterialInputCell
                itemId={heartInput.itemId}
                quantity={heartInput.quantity}
                getBuyPriceInfo={getBuyPriceInfo}
                getAllBuyPrices={getAllBuyPrices}
                onOverride={onOverride}
                onClearOverride={onClearOverride}
              />
            ) : (
              <td className="px-3 py-3 text-right text-[10px]" style={{ color: 'var(--color-text-muted)' }}>—</td>
            )
          )}
          <MaterialInputCell
            itemId={refinedInput.itemId}
            quantity={refinedInput.quantity}
            getBuyPriceInfo={getBuyPriceInfo}
            getAllBuyPrices={getAllBuyPrices}
            onOverride={onOverride}
            onClearOverride={onClearOverride}
          />
        </>
      ) : (
        <td className="px-2 py-3 text-right">
          <div className="flex justify-end">
            <MaterialCostTooltip
              result={result}
              getBuyPriceInfo={getBuyPriceInfo}
              onOverride={onOverride}
              onClearOverride={onClearOverride}
            />
          </div>
        </td>
      )}

      {/* Est. Cost */}
      <td className="px-2 py-3 text-right whitespace-nowrap">
        <div className="flex justify-end">
          <HoverPopover
            trigger={
              <span className="tabular-nums cursor-default flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                {formatSilver(Math.round(estCostNoFocus))}
                <InfoIcon />
              </span>
            }
          >
            <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Estimated Return
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <PopoverRow label={`No Focus (${settings.returnRateNoFocus}%)`} value={formatSilver(Math.round(estReturnNoFocus))} />
              <PopoverRow label={`With Focus (${settings.returnRateWithFocus}%)`} value={formatSilver(Math.round(estReturnWithFocus))} />
              <div className="border-t pt-1.5 mt-0.5" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <PopoverRow label="Material cost" value={formatSilver(Math.round(matCost))} />
                <div className="mt-1">
                  <PopoverRow label="Est. cost (no focus)" value={formatSilver(Math.round(estCostNoFocus))} />
                </div>
                <div className="mt-1">
                  <PopoverRow label="Est. cost (focus)" value={formatSilver(Math.round(estCostWithFocus))} accent />
                </div>
              </div>
            </div>
          </HoverPopover>
        </div>
        <div className="text-[10px] mt-0.5 text-right" style={{ color: 'var(--color-profit)' }}>
          {formatSilver(Math.round(estCostWithFocus))}
        </div>
      </td>

      {/* Product price */}
      <td className="px-2 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="inline-flex flex-col items-end">
            <div className="flex items-center gap-1">
              <PriceCell
                itemId={recipe.productId}
                price={productInfo.price}
                city={productInfo.city}
                isOverride={productInfo.isOverride}
                onOverride={onOverride}
                onClearOverride={onClearOverride}
                hideCity
              />
              {recipe.outputQuantity > 1 && (
                <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  ×{recipe.outputQuantity}
                </span>
              )}
            </div>
            {productInfo.price === 0 && !productInfo.isOverride && (
              <span className="text-[10px] italic" style={{ color: 'var(--color-loss)' }}>
                Click to set
              </span>
            )}
          </div>
          <span
            className="text-[10px] whitespace-nowrap w-[80px] text-center px-1.5 py-0.5 rounded font-medium"
            style={getCityColor(productInfo.city) ? {
              backgroundColor: getCityColor(productInfo.city),
              color: '#111',
            } : {
              color: 'var(--color-text-muted)',
            }}
          >
            {productInfo.city !== 'N/A' ? productInfo.city : ''}
          </span>
        </div>
      </td>

      {/* Estimated sell price — overridable */}
      <td className="px-2 py-3 text-right">
        <PriceCell
          itemId={sellKey}
          price={Math.round(effectiveSellPrice)}
          city={hasSellOverride ? 'Manual' : ''}
          isOverride={hasSellOverride}
          onOverride={onOverride}
          onClearOverride={onClearOverride}
          hideCity
        />
      </td>

      {/* Profit no focus */}
      <td className="px-2 py-3 text-right whitespace-nowrap">
        {result.incomplete ? (
          <span className="text-[10px] italic" style={{ color: 'var(--color-text-muted)' }}>N/A</span>
        ) : (() => {
          const profitVal = hasSellOverride ? displayProfitNoFocus : effectiveProfitNoFocus(result);
          return (
          <div className="flex justify-end">
            <HoverPopover
              trigger={
                <span className="tabular-nums cursor-default flex items-center gap-1 font-medium" style={{ color: profitColor(profitVal) }}>
                  {result.transmuteAlt && !hasSellOverride && (
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  )}
                  {formatSilver(Math.round(profitVal * quantity))}
                  <InfoIcon />
                </span>
              }
            >
              <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Profit Breakdown (No Focus)
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <PopoverRow label="Sell price" value={formatSilver(Math.round(effectiveSellPrice))} />
                <PopoverRow label={`Material cost (${settings.returnRateNoFocus}% return)`} value={`-${formatSilver(Math.round(estCostNoFocus))}`} />
                <PopoverRow label="Nutrition cost" value={`-${formatSilver(result.nutritionCost)}`} />
                <div className="border-t pt-1.5 mt-0.5" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <PopoverRow label="Profit per craft" value={formatSilver(Math.round(profitVal))} accent />
                  {quantity > 1 && (
                    <div className="mt-1">
                      <PopoverRow label={`Total (×${quantity})`} value={formatSilver(Math.round(profitVal * quantity))} accent />
                    </div>
                  )}
                </div>
              </div>
            </HoverPopover>
          </div>
          );
        })()}
      </td>

      {/* Profit with focus */}
      <td className="px-2 py-3 text-right whitespace-nowrap">
        {result.incomplete ? (
          <span className="text-[10px] italic" style={{ color: 'var(--color-text-muted)' }}>N/A</span>
        ) : (() => {
          const profitVal = hasSellOverride ? displayProfitWithFocus : effectiveProfitWithFocus(result);
          return (
          <div className="flex justify-end">
            <HoverPopover
              trigger={
                <span className="tabular-nums cursor-default flex items-center gap-1 font-medium" style={{ color: profitColor(profitVal) }}>
                  {result.transmuteAlt && !hasSellOverride && (
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  )}
                  {formatSilver(Math.round(profitVal * quantity))}
                  <InfoIcon />
                </span>
              }
            >
              <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Profit Breakdown (With Focus)
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <PopoverRow label="Sell price" value={formatSilver(Math.round(effectiveSellPrice))} />
                <PopoverRow label={`Material cost (${settings.returnRateWithFocus}% return)`} value={`-${formatSilver(Math.round(estCostWithFocus))}`} />
                <PopoverRow label="Nutrition cost" value={`-${formatSilver(result.nutritionCost)}`} />
                <PopoverRow label={result.actualFocusCost !== recipe.focusCost ? `Focus cost (spec'd)` : "Focus cost"} value={String(result.actualFocusCost)} />
                <div className="border-t pt-1.5 mt-0.5" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <PopoverRow label="Profit per craft" value={formatSilver(Math.round(profitVal))} accent />
                  {quantity > 1 && (
                    <div className="mt-1">
                      <PopoverRow label={`Total (×${quantity})`} value={formatSilver(Math.round(profitVal * quantity))} accent />
                    </div>
                  )}
                </div>
              </div>
            </HoverPopover>
          </div>
          );
        })()}
      </td>

      {/* Focus efficiency */}
      <td className="px-2 py-3 text-right whitespace-nowrap">
        {result.incomplete ? (
          <span className="text-[10px] italic" style={{ color: 'var(--color-text-muted)' }}>N/A</span>
        ) : (() => {
          const effProfit = hasSellOverride ? displayProfitWithFocus : effectiveProfitWithFocus(result)
          const effFocusEff = result.actualFocusCost > 0 ? Math.round(effProfit / result.actualFocusCost) : 0
          return (
          <div className="flex justify-end">
            <HoverPopover
              trigger={
                <span className="tabular-nums cursor-default flex items-center gap-1" style={{ color: profitColor(effFocusEff) }}>
                  {effFocusEff}
                  <InfoIcon />
                </span>
              }
            >
              <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Focus Efficiency
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <PopoverRow label="Profit (Focus)" value={formatSilver(Math.round(effProfit))} accent />
                <PopoverRow label={result.actualFocusCost !== recipe.focusCost ? "Actual focus cost" : "Focus cost"} value={String(result.actualFocusCost)} />
                <div className="border-t pt-1.5 mt-0.5" style={{ borderColor: 'var(--color-border)' }}>
                  <PopoverRow label="Focus Eff." value={`${formatSilver(Math.round(effProfit))} / ${result.actualFocusCost} = ${effFocusEff}`} accent />
                </div>
                {result.actualFocusCost !== recipe.focusCost && (
                  <div className="text-[11px] mt-0.5 italic" style={{ color: 'var(--color-text-muted)' }}>
                    Focus reduced by specialization (base: {recipe.focusCost})
                  </div>
                )}
              </div>
            </HoverPopover>
          </div>
          )
        })()}
      </td>
    </tr>
  );
}
