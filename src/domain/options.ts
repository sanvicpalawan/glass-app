/**
 * Option tree system — data-driven options/answers with price adjustments.
 * This is the "full per-series option" structure: categories (Glass, Grille, Screen,
 * Reinforcement, Sill, etc.), each with selectable answers that carry an adjustment.
 * In production these come from the supplier/profile database per series.
 */

import type { Series } from "./types.ts";

export interface OptionAnswerDef {
  code: string;
  label: string;
  /** Flat adjustment in PHP per unit (added to subtotal before margin). */
  adjustFlat?: number;
  /** Percent adjustment on profile+glass subtotal (0.05 = +5%). */
  adjustPct?: number;
  rgb?: [number, number, number];
}

export interface OptionCategoryDef {
  id: string;
  label: string;
  description?: string;
  /** Which series families this applies to; empty = all. */
  families?: string[];
  answers: OptionAnswerDef[];
  defaultCode?: string;
}

export const OPTION_CATALOG: OptionCategoryDef[] = [
  {
    id: "grille_type",
    label: "Grille / Muntin",
    description: "Decorative grille pattern",
    answers: [
      { code: "none", label: "None", adjustFlat: 0 },
      { code: "colonial", label: "Colonial grid", adjustFlat: 450 },
      { code: "prairie", label: "Prairie", adjustFlat: 380 },
      { code: "perimeter", label: "Perimeter", adjustFlat: 320 },
      { code: "sdl", label: "SDL (Simulated Divided Lite)", adjustFlat: 850 },
      { code: "gbg", label: "GBG (Grille Between Glass)", adjustFlat: 650 },
    ],
    defaultCode: "none",
  },
  {
    id: "sill_type",
    label: "Sill / Threshold",
    answers: [
      { code: "standard", label: "Standard sill", adjustFlat: 0 },
      { code: "sloped", label: "Sloped sill", adjustFlat: 180 },
      { code: "flush", label: "Flush sill", adjustFlat: 220 },
      { code: "extended", label: "Extended sill", adjustFlat: 350 },
      { code: "threshold_low", label: "Low threshold (door)", adjustFlat: 420 },
    ],
    defaultCode: "standard",
  },
  {
    id: "reinforcement",
    label: "Reinforcement",
    families: ["Casement/Awning", "Sliding Window", "Door"],
    answers: [
      { code: "none", label: "Standard", adjustFlat: 0 },
      { code: "steel", label: "Steel reinforcement", adjustPct: 0.06 },
      { code: "heavy", label: "Heavy duty reinforcement", adjustPct: 0.1 },
      { code: "hurricane", label: "Hurricane / impact rated", adjustPct: 0.18 },
    ],
    defaultCode: "none",
  },
  {
    id: "screen_type",
    label: "Screen type",
    answers: [
      { code: "none", label: "No screen", adjustFlat: 0 },
      { code: "fiberglass", label: "Fiberglass mesh", adjustFlat: 0 },
      { code: "aluminum", label: "Aluminum mesh", adjustFlat: 120 },
      { code: "pet", label: "Pet-resistant mesh", adjustFlat: 280 },
      { code: "stainless", label: "Stainless security mesh", adjustFlat: 650 },
    ],
    defaultCode: "fiberglass",
  },
  {
    id: "handle",
    label: "Handle / Lock",
    answers: [
      { code: "standard", label: "Standard", adjustFlat: 0 },
      { code: "premium", label: "Premium handle set", adjustFlat: 350 },
      { code: "keyed", label: "Keyed lock", adjustFlat: 280 },
      { code: "multipoint", label: "Multi-point lock", adjustFlat: 750 },
    ],
    defaultCode: "standard",
  },
  {
    id: "weatherstrip",
    label: "Weatherstripping / Seal",
    answers: [
      { code: "standard", label: "Standard EPDM", adjustFlat: 0 },
      { code: "premium", label: "Premium triple seal", adjustPct: 0.03 },
      { code: "acoustic", label: "Acoustic seal", adjustPct: 0.05 },
    ],
    defaultCode: "standard",
  },
];

export type SelectedOptions = Record<string, string>; // categoryId -> answerCode

export function optionsForSeries(series: Series): OptionCategoryDef[] {
  return OPTION_CATALOG.filter((c) => !c.families || c.families.length === 0 || c.families.includes(series.family));
}

export function defaultSelections(series: Series): SelectedOptions {
  const out: SelectedOptions = {};
  for (const c of optionsForSeries(series)) out[c.id] = c.defaultCode || c.answers[0]?.code || "";
  return out;
}

export function optionsAdjustment(selected: SelectedOptions | undefined, baseSubtotal: number): { flat: number; pctAmount: number; total: number; lines: { label: string; amount: number }[] } {
  const lines: { label: string; amount: number }[] = [];
  let flat = 0;
  let pct = 0;
  if (!selected) return { flat: 0, pctAmount: 0, total: 0, lines };
  for (const cat of OPTION_CATALOG) {
    const code = selected[cat.id];
    if (!code) continue;
    const ans = cat.answers.find((a) => a.code === code);
    if (!ans) continue;
    if (ans.adjustFlat && ans.adjustFlat !== 0) { flat += ans.adjustFlat; lines.push({ label: `${cat.label}: ${ans.label}`, amount: ans.adjustFlat }); }
    if (ans.adjustPct && ans.adjustPct !== 0) { pct += ans.adjustPct; }
  }
  const pctAmount = baseSubtotal * pct;
  if (pct > 0) lines.push({ label: `Option uplifts (${Math.round(pct * 100)}%)`, amount: pctAmount });
  return { flat, pctAmount, total: flat + pctAmount, lines };
}
