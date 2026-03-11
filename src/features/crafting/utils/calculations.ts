import type { Recipe } from '../data/recipes';
import type { Transmutation } from '../data/transmutations';

export type SpecLevels = [number, number, number, number, number]; // T4, T5, T6, T7, T8

export interface Settings {
  returnRateNoFocus: number;   // 36.7
  returnRateWithFocus: number; // 53.9
  nutritionPricePer100: number; // 395
  sellMarkdown: number;        // 5 (percent)
  enableTransmute: boolean;    // calculate cheaper-via-transmute
  specLevels: SpecLevels;      // spec levels 0-100 for T4-T8
  showMaterials: boolean;      // split material cost into per-input columns
  useBuyOrders: boolean;       // use buy_price_max for material costs
  useSellNow: boolean;         // use buy_price_max for sell price, no markdown
}

export const DEFAULT_SETTINGS: Settings = {
  returnRateNoFocus: 36.7,
  returnRateWithFocus: 53.9,
  nutritionPricePer100: 395,
  sellMarkdown: 5,
  enableTransmute: true,
  specLevels: [0, 0, 0, 0, 0],
  showMaterials: false,
  useBuyOrders: false,
  useSellNow: false,
};

/**
 * Calculate actual focus cost after spec reduction.
 * FCE = (sum of all 5 spec levels) × 30 + (current tier spec) × 250
 * Actual Focus = Base Focus × 0.5^(FCE / 10000)
 */
export function calculateActualFocusCost(
  baseFocusCost: number,
  tier: number,
  specLevels: SpecLevels,
): number {
  const sumAllSpecs = specLevels[0] + specLevels[1] + specLevels[2] + specLevels[3] + specLevels[4];
  const tierSpec = specLevels[tier - 4]; // tier 4 = index 0, tier 8 = index 4
  const fce = sumAllSpecs * 30 + tierSpec * 250;
  return Math.round(baseFocusCost * Math.pow(0.5, fce / 10000));
}

export interface RefineResult {
  recipe: Recipe;
  materialCost: number;
  nutritionCost: number;
  effectiveCostNoFocus: number;
  effectiveCostWithFocus: number;
  estimatedSellPrice: number;
  profitNoFocus: number;
  profitWithFocus: number;
  focusEfficiency: number;
  productPrice: number;
  actualFocusCost: number;
  incomplete: boolean;  // true when any buy or sell price is missing (0)
}

export function calculateRefine(
  recipe: Recipe,
  getBuyPrice: (itemId: string) => number,
  getSellPrice: (itemId: string) => number,
  settings: Settings
): RefineResult {
  let materialCost = 0;
  let hasMissingBuy = false;
  for (const input of recipe.inputs) {
    const price = getBuyPrice(input.itemId);
    if (price === 0) hasMissingBuy = true;
    materialCost += input.quantity * price;
  }

  const nutritionCost = Math.round(
    settings.nutritionPricePer100 * recipe.nutrition / 100
  );

  const keepRateNoFocus = (100 - settings.returnRateNoFocus) / 100;
  const keepRateWithFocus = (100 - settings.returnRateWithFocus) / 100;

  const effectiveCostNoFocus = keepRateNoFocus * materialCost + nutritionCost;
  const effectiveCostWithFocus = keepRateWithFocus * materialCost + nutritionCost;

  const productPrice = getSellPrice(recipe.productId);
  const markdownMultiplier = settings.useSellNow ? 1.0 : (100 - settings.sellMarkdown) / 100;
  const estimatedSellPrice = productPrice * markdownMultiplier * recipe.outputQuantity;

  const incomplete = hasMissingBuy || productPrice === 0;

  const profitNoFocus = incomplete ? 0 : estimatedSellPrice - effectiveCostNoFocus;
  const profitWithFocus = incomplete ? 0 : estimatedSellPrice - effectiveCostWithFocus;

  const actualFocusCost = calculateActualFocusCost(recipe.focusCost, recipe.tier, settings.specLevels);

  const focusEfficiency = incomplete || actualFocusCost <= 0
    ? 0
    : Math.round(profitWithFocus / actualFocusCost);

  return {
    recipe,
    materialCost,
    nutritionCost,
    effectiveCostNoFocus,
    effectiveCostWithFocus,
    estimatedSellPrice,
    profitNoFocus,
    profitWithFocus,
    focusEfficiency,
    productPrice,
    actualFocusCost,
    incomplete,
  };
}

export interface TransmuteResult {
  transmutation: Transmutation;
  sourcePrice: number;
  totalCost: number;
  productPrice: number;
  profitLoss: number;
}

export function calculateTransmutation(
  tx: Transmutation,
  getBuyPrice: (itemId: string) => number,
  getSellPrice: (itemId: string) => number
): TransmuteResult {
  const sourcePrice = getBuyPrice(tx.fromId);
  const totalCost = tx.transmuteCost + sourcePrice;
  const productPrice = getSellPrice(tx.toId);
  const profitLoss = totalCost - productPrice;

  return {
    transmutation: tx,
    sourcePrice,
    totalCost,
    productPrice,
    profitLoss,
  };
}

/* ─── Transmute-before-refine optimization ─── */

export interface TransmuteAlternative {
  steps: Transmutation[];       // ordered from source to target (at least 1 step)
  sourceItemId: string;
  sourceLabel: string;
  sourceBuyPrice: number;       // buy price of the initial source
  totalTransmuteCost: number;   // sum of all step transmute costs
  costPerUnit: number;          // sourceBuyPrice + totalTransmuteCost
  directBuyPrice: number;       // buy price of the target input directly
  savingsPerUnit: number;       // directBuyPrice - costPerUnit (positive = saves money)
}

/**
 * For a given raw-resource input, find the cheapest transmutation path
 * (possibly multi-step) that produces it for less than buying directly.
 * E.g. buying 8.1 → transmuting to 8.2 → transmuting to 8.3 may be
 * cheaper than buying 8.2 and transmuting to 8.3, or buying 8.3 directly.
 * Returns null if no cheaper path exists.
 */
export function findBestMultiStepTransmute(
  targetItemId: string,
  transmutations: Transmutation[],
  getBuyPrice: (id: string) => number,
): TransmuteAlternative | null {
  const directBuyPrice = getBuyPrice(targetItemId);
  if (directBuyPrice === 0) return null; // can't compare without direct price

  // Build reverse adjacency: toId → transmutations that produce it
  const reverseMap = new Map<string, Transmutation[]>();
  for (const tx of transmutations) {
    const arr = reverseMap.get(tx.toId) || [];
    arr.push(tx);
    reverseMap.set(tx.toId, arr);
  }

  // Find cheapest way to obtain an item (buy directly or transmute from cheaper source)
  interface PathResult {
    cost: number;
    steps: Transmutation[];
    sourceItemId: string;
  }
  const memo = new Map<string, PathResult | null>();

  function findCheapest(itemId: string): PathResult | null {
    if (memo.has(itemId)) return memo.get(itemId)!;

    const buyPrice = getBuyPrice(itemId);
    let best: PathResult | null = buyPrice > 0
      ? { cost: buyPrice, steps: [], sourceItemId: itemId }
      : null;

    const sources = reverseMap.get(itemId) || [];
    for (const tx of sources) {
      const sourceResult = findCheapest(tx.fromId);
      if (!sourceResult) continue;

      const totalCost = sourceResult.cost + tx.transmuteCost;
      if (!best || totalCost < best.cost) {
        best = {
          cost: totalCost,
          steps: [...sourceResult.steps, tx],
          sourceItemId: sourceResult.sourceItemId,
        };
      }
    }

    memo.set(itemId, best);
    return best;
  }

  // Find cheapest path with at least one transmute step
  const sources = reverseMap.get(targetItemId) || [];
  let bestPath: PathResult | null = null;

  for (const tx of sources) {
    const sourceResult = findCheapest(tx.fromId);
    if (!sourceResult) continue;

    const totalCost = sourceResult.cost + tx.transmuteCost;
    if (!bestPath || totalCost < bestPath.cost) {
      bestPath = {
        cost: totalCost,
        steps: [...sourceResult.steps, tx],
        sourceItemId: sourceResult.sourceItemId,
      };
    }
  }

  if (!bestPath || bestPath.cost >= directBuyPrice) return null;

  const sourceBuyPrice = getBuyPrice(bestPath.sourceItemId);
  const totalTransmuteCost = bestPath.steps.reduce((sum, tx) => sum + tx.transmuteCost, 0);

  return {
    steps: bestPath.steps,
    sourceItemId: bestPath.sourceItemId,
    sourceLabel: bestPath.steps[0].fromLabel,
    sourceBuyPrice,
    totalTransmuteCost,
    costPerUnit: sourceBuyPrice + totalTransmuteCost,
    directBuyPrice,
    savingsPerUnit: directBuyPrice - (sourceBuyPrice + totalTransmuteCost),
  };
}

export interface TransmuteAltResult {
  alternative: TransmuteAlternative;
  quantity: number;
  totalSavings: number;
  adjustedMaterialCost: number;
  adjustedProfitNoFocus: number;
  adjustedProfitWithFocus: number;
}

export interface RefineResultWithTransmute extends RefineResult {
  transmuteAlt: TransmuteAltResult | null;
}

/**
 * Calculate refine result AND check whether transmuting the raw-resource input
 * (recipe.inputs[0]) would be cheaper. Returns extended result with transmute data.
 */
export function calculateRefineWithTransmute(
  recipe: Recipe,
  getBuyPrice: (id: string) => number,
  getSellPrice: (id: string) => number,
  settings: Settings,
  transmutations: Transmutation[],
): RefineResultWithTransmute {
  const base = calculateRefine(recipe, getBuyPrice, getSellPrice, settings);

  // Only the first input is a raw resource eligible for transmutation
  const rawInput = recipe.inputs[0];
  const alt = findBestMultiStepTransmute(rawInput.itemId, transmutations, getBuyPrice);

  if (!alt) {
    return { ...base, transmuteAlt: null };
  }

  const quantity = rawInput.quantity;
  const totalSavings = alt.savingsPerUnit * quantity;

  // Adjusted material cost: replace raw input cost with transmute cost
  const adjustedMaterialCost = base.materialCost - (alt.directBuyPrice * quantity) + (alt.costPerUnit * quantity);

  const keepRateNoFocus = (100 - settings.returnRateNoFocus) / 100;
  const keepRateWithFocus = (100 - settings.returnRateWithFocus) / 100;

  const adjustedEffectiveCostNoFocus = keepRateNoFocus * adjustedMaterialCost + base.nutritionCost;
  const adjustedEffectiveCostWithFocus = keepRateWithFocus * adjustedMaterialCost + base.nutritionCost;

  const adjustedProfitNoFocus = base.incomplete ? 0 : base.estimatedSellPrice - adjustedEffectiveCostNoFocus;
  const adjustedProfitWithFocus = base.incomplete ? 0 : base.estimatedSellPrice - adjustedEffectiveCostWithFocus;

  return {
    ...base,
    transmuteAlt: {
      alternative: alt,
      quantity,
      totalSavings,
      adjustedMaterialCost,
      adjustedProfitNoFocus,
      adjustedProfitWithFocus,
    },
  };
}

export function formatSilver(value: number): string {
  if (value === 0) return '-';
  return value.toLocaleString('en-US');
}
