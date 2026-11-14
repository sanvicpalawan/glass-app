/**
 * 1D bar nesting (cut optimisation).
 * First-fit decreasing bin packing: place each cut in the first bar that fits,
 * using bars of `stockLength`. Minimises offcuts in practice for typical window cuts.
 */

export interface Cut {
  label: string;
  length: number;
  quantity: number;
}

export interface Bar {
  index: number;
  cuts: { label: string; length: number }[];
  used: number;
  waste: number;
}

export interface NestingResult {
  stockLength: number;
  bars: Bar[];
  totalBars: number;
  totalUsed: number;
  totalWaste: number;
  efficiency: number; // 0-1
}

export function nestCuts(cuts: Cut[], stockLength: number, kerf = 3): NestingResult {
  const pieces: { label: string; length: number }[] = [];
  for (const c of cuts) {
    for (let i = 0; i < c.quantity; i++) pieces.push({ label: c.label, length: c.length });
  }
  // largest first
  pieces.sort((a, b) => b.length - a.length);
  const bars: Bar[] = [];

  for (const p of pieces) {
    const need = p.length + (kerf || 0);
    let placed = false;
    for (const bar of bars) {
      if (bar.used + need <= stockLength + 0.001) {
        bar.cuts.push(p);
        bar.used += need;
        bar.waste = Math.max(0, stockLength - bar.used);
        placed = true;
        break;
      }
    }
    if (!placed) {
      const bar: Bar = { index: bars.length + 1, cuts: [p], used: Math.min(need, stockLength), waste: 0 };
      bar.waste = Math.max(0, stockLength - bar.used);
      bars.push(bar);
    }
  }

  const totalUsed = bars.reduce((s, b) => s + b.used - b.cuts.length * kerf, 0);
  const totalWaste = bars.reduce((s, b) => s + b.waste, 0);
  const capacity = bars.length * stockLength;
  const efficiency = capacity > 0 ? Math.max(0, Math.min(1, (capacity - totalWaste) / capacity)) : 1;
  return { stockLength, bars, totalBars: bars.length, totalUsed, totalWaste, efficiency };
}
