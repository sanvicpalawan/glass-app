/**
 * Production batching — aggregate glass and hardware across multiple designs/lines.
 */

import type { Design, Geometry } from "./types.ts";
import { GLASS_LABELS, HARDWARE_LABELS } from "./catalogue.ts";

export interface GlassBatchItem {
  glass: string;
  glassLabel: string;
  panes: { ref: string; width: number; height: number; area: number; qty: number }[];
  totalArea: number;
  totalPanes: number;
}

export interface HardwareBatchItem {
  kind: string;
  label: string;
  qty: number;
}

export interface PickList {
  glass: GlassBatchItem[];
  hardware: HardwareBatchItem[];
  screens: number;
}

export function batchPickList(items: { design: Design; geometry: Geometry; ref: string }[]): PickList {
  const glassMap = new Map<string, GlassBatchItem>();
  const hwMap = new Map<string, number>();
  let screens = 0;

  for (const item of items) {
    const { design, geometry, ref } = item;
    const gk = design.glass;
    if (!glassMap.has(gk)) glassMap.set(gk, { glass: gk, glassLabel: (GLASS_LABELS as any)[gk] || gk, panes: [], totalArea: 0, totalPanes: 0 });
    const gb = glassMap.get(gk)!;
    for (const p of geometry.panes) {
      gb.panes.push({ ref, width: p.width, height: p.height, area: p.area, qty: design.quantity });
      gb.totalArea += p.area * design.quantity;
      gb.totalPanes += design.quantity;
    }

    if (design.hardware !== "none" && geometry.leaves > 0) {
      const key = design.hardware;
      hwMap.set(key, (hwMap.get(key) || 0) + geometry.leaves * design.quantity);
    }
    if (design.screen && geometry.leaves > 0) screens += geometry.leaves * design.quantity;
  }

  const glass = [...glassMap.values()].sort((a, b) => b.totalArea - a.totalArea);
  const hardware = [...hwMap.entries()].map(([kind, qty]) => ({ kind, label: (HARDWARE_LABELS as any)[kind] || kind, qty }));
  return { glass, hardware, screens };
}
