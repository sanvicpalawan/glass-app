/**
 * Geometry engine. Produces cut list and glass order from a design + series.
 * Deductions are driven by the series. Unsupported/complex operations (bay, bifold, etc.)
 * fall back to a sensible generic layout so they still quote and cut — refine with a
 * supplier datasheet per series.
 */

import { getSeries } from "./catalogue.ts";
import type { Design, Geometry, Member, Operation, Pane, RoughOpening, Series } from "./types.ts";

const round = (n: number) => Math.round(n);
function add(members: Member[], name: string, length: number, quantity = 1) {
  if (length > 0 && quantity > 0) members.push({ name, length: round(length), quantity });
}
function pane(w: number, h: number): Pane {
  const ww = Math.max(0, w), hh = Math.max(0, h);
  return { width: round(ww), height: round(hh), area: (ww * hh) / 1e6 };
}

export function isSliding(op: Operation): boolean {
  return ["sliding2", "sliding3", "sliding4", "door_sliding2", "door_patio", "door_multi_slide", "door_pocket"].includes(op);
}
export function isDoor(op: Operation): boolean {
  return ["door_hinged", "door_sliding2", "door_patio", "door_multi_slide", "door_pocket", "door_bifold"].includes(op);
}

export function panelCount(operation: Operation): { panels: number; leaves: number } {
  switch (operation) {
    case "sliding2": case "door_sliding2": case "door_patio": return { panels: 2, leaves: 2 };
    case "sliding3": return { panels: 3, leaves: 3 };
    case "sliding4": case "door_multi_slide": case "door_bifold": return { panels: 4, leaves: 4 };
    case "door_pocket": return { panels: 1, leaves: 1 };
    case "casement2": return { panels: 2, leaves: 2 };
    case "casement1": case "awning": case "tilt_turn": case "door_hinged": return { panels: 1, leaves: 1 };
    case "bay": return { panels: 3, leaves: 0 };
    case "garden": return { panels: 3, leaves: 1 };
    case "sealed_unit": case "screen_only": case "fixed": case "skylight":
    default: return { panels: 1, leaves: 0 };
  }
}

export function buildGeometry(design: Design): Geometry {
  const series: Series = getSeries(design.seriesId);
  const { face, rebate, stile, sashClear, overlap } = series;
  const { width: w, height: h, operation } = design;
  const members: Member[] = [];
  const panes: Pane[] = [];
  const { panels, leaves } = panelCount(operation);
  const layout = design.layout ?? { cols: isSliding(operation) ? panels : panels, rows: 1 };
  const cols = Math.max(1, layout.cols || 1);
  const rows = Math.max(1, layout.rows || 1);
  // custom splits affect pane sizing; member counts still approximated by cols/rows
  const vRatios = (layout.vSplits && layout.vSplits.length === cols - 1) ? [0, ...[...layout.vSplits].sort((a,b)=>a-b), 1] : Array.from({length: cols+1}, (_,i)=>i/cols);
  const hRatios = (layout.hSplits && layout.hSplits.length === rows - 1) ? [0, ...[...layout.hSplits].sort((a,b)=>a-b), 1] : Array.from({length: rows+1}, (_,i)=>i/rows);

  if (isSliding(operation)) {
    add(members, "Track head", w);
    add(members, "Track sill", w);
    add(members, "Jamb", h, 2);
    const panelCountN = Math.max(cols, panels);
    const pw = (w - 2 * face + overlap * Math.max(0, panelCountN - 1)) / panelCountN;
    const ph = h - 2 * face - 2;
    add(members, "Panel stile", ph, 2 * panelCountN);
    add(members, "Panel rail", pw, 2 * panelCountN);
    add(members, "Meeting/interlock stile", ph, panelCountN);
    if (rows > 1) add(members, "Transom", pw - 2 * stile, (rows - 1) * panelCountN);
    const innerH = ph - 2 * stile;
    for (let c = 0; c < panelCountN; c++) for (let r = 0; r < rows; r++) panes.push(pane(pw - 2 * stile, innerH * (hRatios[r+1]-hRatios[r]) - (r < rows - 1 ? stile / 2 : 0)));
  } else if (["casement1", "casement2", "awning", "tilt_turn", "door_hinged"].includes(operation)) {
    add(members, "Head", w);
    add(members, "Sill", w);
    add(members, "Jamb", h, 2);
    if (cols === 2 || panels === 2) {
      add(members, "Mullion", h);
      const sw = (w - 2 * face - sashClear * 3) / 2;
      const sh = h - 2 * face - sashClear * 2;
      add(members, "Sash stile", sh, 4);
      add(members, "Sash rail", sw, 4);
      if (rows > 1) add(members, "Transom", sw - 2 * stile, (rows - 1) * 2);
      const innerH = sh - 2 * stile;
      for (let c = 0; c < 2; c++) for (let r = 0; r < rows; r++) panes.push(pane(sw - 2 * stile, innerH * (hRatios[r+1]-hRatios[r]) - (r < rows - 1 ? stile / 2 : 0)));
    } else {
      const sw = w - 2 * face - sashClear * 2;
      const sh = h - 2 * face - sashClear * 2;
      add(members, "Sash stile", sh, 2);
      add(members, "Sash rail", sw, 2);
      if (cols > 1) add(members, "Mullion", sh - 2 * stile, cols - 1);
      if (rows > 1) add(members, "Transom", sw - 2 * stile, (rows - 1) * cols);
      const innerW = sw - 2 * stile;
      const innerH = sh - 2 * stile;
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) panes.push(pane(innerW * (vRatios[c+1]-vRatios[c]) - (c < cols - 1 ? stile / 2 : 0), innerH * (hRatios[r+1]-hRatios[r]) - (r < rows - 1 ? stile / 2 : 0)));
    }
  } else if (operation === "bay") {
    const bw = w / Math.max(cols, 3);
    add(members, "Head", w);
    add(members, "Sill", w);
    add(members, "Jamb/post", h, Math.max(cols, 3) + 1);
    for (let i = 0; i < Math.max(cols, 3); i++) panes.push(pane(bw - 2 * face + 2 * rebate, h - 2 * face + 2 * rebate));
  } else if (operation === "garden") {
    add(members, "Head/sill", w, 2);
    add(members, "Jamb", h, 2);
    add(members, "Seat board", w - 2 * face);
    add(members, "Side return", Math.max(200, h * 0.35), 2);
    panes.push(pane(w - 2 * face + 2 * rebate, h * 0.6 - face + rebate));
    panes.push(pane(Math.max(150, h * 0.35) - face, h * 0.6 - face));
    panes.push(pane(Math.max(150, h * 0.35) - face, h * 0.6 - face));
  } else {
    // fixed, sealed unit, screen, skylight, generic — support grid
    add(members, "Head", w);
    add(members, "Sill", w);
    add(members, "Jamb", h, 2);
    const innerW = w - 2 * face + 2 * rebate;
    const innerH = h - 2 * face + 2 * rebate;
    if (cols > 1) add(members, "Mullion", innerH, cols - 1);
    if (rows > 1) add(members, "Transom", innerW, rows - 1);
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) panes.push(pane(innerW * (vRatios[c+1]-vRatios[c]) - (c < cols - 1 ? 4 : 0), innerH * (hRatios[r+1]-hRatios[r]) - (r < rows - 1 ? 4 : 0)));
  }

  const profileLength = members.reduce((s, m) => s + m.length * m.quantity, 0);
  const glassArea = panes.reduce((s, p) => s + p.area, 0);
  return { members, panes, panels: Math.max(panels, cols), leaves, profileLength, glassArea, series };
}

export function roughOpening(design: Design, series?: Series): RoughOpening {
  const s = series ?? getSeries(design.seriesId);
  const rule = s.roRules[design.measureType];
  const width = design.width + rule.widthAdd;
  const height = design.height + rule.heightAdd + rule.headExtra;
  return { width: round(width), height: round(height), rule, adjusted: rule.widthAdd !== 0 || rule.heightAdd !== 0 || rule.headExtra !== 0 };
}

export function widestPanel(design: Design, geometry: Geometry): number {
  const { face, overlap } = geometry.series;
  if (!isSliding(design.operation)) return design.width;
  return (design.width - 2 * face + overlap * (geometry.panels - 1)) / geometry.panels;
}

export function barsFor(member: Member, stockBarLength: number): number {
  if (member.length <= 0) return 0;
  return Math.ceil((member.length * member.quantity) / stockBarLength);
}
