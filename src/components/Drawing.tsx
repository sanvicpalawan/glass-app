"use client";

import { useMemo, useRef } from "react";
import { feetInches, num } from "@/domain/format";
import type { Design, Geometry, GridLayout, OpeningShape, RoughOpening } from "@/domain/types";

interface Props {
  design: Design;
  geometry: Geometry;
  roughOpening: RoughOpening;
  extColour: string;
  intColour: string;
  editable?: boolean;
  onLayoutChange?: (layout: GridLayout) => void;
}

const VIEW_W = 620;
const VIEW_H = 440;
const PAD = 52;

function splitsFor(count: number, custom?: number[]) {
  if (custom && custom.length === count - 1) return [0, ...[...custom].sort((a, b) => a - b), 1];
  return Array.from({ length: count + 1 }, (_, i) => i / count);
}

function topPath(shape: OpeningShape | undefined, x: number, y: number, w: number, h: number, risePx: number) {
  // returns path for full outline starting at bottom-left going up left, across top shape, down right, across bottom
  const bl = `${x},${y + h}`; const br = `${x + w},${y + h}`; const tr = `${x + w},${y}`; const tl = `${x},${y}`;
  if (!shape || shape === "rect") return `M ${bl} L ${tl} L ${tr} L ${br} Z`;
  const r = Math.min(risePx, h * 0.45, w / 2);
  if (shape === "arch") {
    return `M ${bl} L ${x},${y + r} Q ${x + w / 2},${y - r * 0.6} ${x + w},${y + r} L ${br} Z`;
  }
  if (shape === "round_top") {
    return `M ${bl} L ${x},${y + r} A ${w / 2} ${r} 0 0 1 ${x + w},${y + r} L ${br} Z`;
  }
  if (shape === "raked_left") {
    return `M ${bl} L ${x},${y} L ${x + w},${y + r} L ${br} Z`;
  }
  if (shape === "raked_right") {
    return `M ${bl} L ${x},${y + r} L ${x + w},${y} L ${br} Z`;
  }
  if (shape === "triangle") {
    return `M ${bl} L ${x + w / 2},${y} L ${br} Z`;
  }
  return `M ${bl} L ${tl} L ${tr} L ${br} Z`;
}

export function Drawing({ design, geometry, roughOpening, extColour, intColour, editable, onLayoutChange }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ axis: "v" | "h"; index: number } | null>(null);

  const { width: w, height: h } = design;
  const scale = Math.min((VIEW_W - 2 * PAD) / w, (VIEW_H - 2 * PAD) / h);
  const dw = w * scale;
  const dh = h * scale;
  const x0 = (VIEW_W - dw) / 2;
  const y0 = (VIEW_H - dh) / 2;
  const face = Math.max(3, geometry.series.face * scale);
  const frame = `rgb(${extColour})`;
  const innerCol = `rgb(${intColour})`;

  const layout = design.layout ?? { cols: geometry.panels || 1, rows: 1 };
  const cols = Math.max(1, layout.cols || 1);
  const rows = Math.max(1, layout.rows || 1);
  const v = useMemo(() => splitsFor(cols, layout.vSplits), [cols, layout.vSplits]);
  const hr = useMemo(() => splitsFor(rows, layout.hSplits), [rows, layout.hSplits]);

  const gx = x0 + face;
  const gy = y0 + face;
  const gw = dw - 2 * face;
  const gh = dh - 2 * face;
  const shape = design.shape || "rect";
  const riseMm = design.archRise ?? Math.round(h * 0.2);
  const risePx = riseMm * scale;
  const clipId = `clip-${Math.abs((w * 31 + h * 17) | 0)}-${shape}`;

  const panes: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = gx + v[c] * gw + 3;
      const py = gy + hr[r] * gh + 3;
      const pw = (v[c + 1] - v[c]) * gw - 6;
      const ph = (hr[r + 1] - hr[r]) * gh - 6;
      panes.push(<rect key={`p-${r}-${c}`} x={px} y={py} width={Math.max(0, pw)} height={Math.max(0, ph)} fill="var(--glass)" stroke="var(--glass-line)" />);
    }
  }

  const dividers: React.ReactNode[] = [];
  for (let c = 1; c < cols; c++) {
    const x = gx + v[c] * gw;
    dividers.push(<line key={`vc-${c}`} x1={x} y1={gy} x2={x} y2={gy + gh} stroke={frame} strokeWidth={Math.max(2, face * 0.35)} />);
    if (editable) dividers.push(<line key={`vh-${c}`} x1={x} y1={gy} x2={x} y2={gy + gh} stroke="transparent" strokeWidth={14} style={{ cursor: "ew-resize" }} onPointerDown={(e) => { dragRef.current = { axis: "v", index: c - 1 }; (e.target as Element).setPointerCapture?.(e.pointerId); }} />);
  }
  for (let r = 1; r < rows; r++) {
    const y = gy + hr[r] * gh;
    dividers.push(<line key={`hr-${r}`} x1={gx} y1={y} x2={gx + gw} y2={y} stroke={frame} strokeWidth={Math.max(2, face * 0.35)} />);
    if (editable) dividers.push(<line key={`hh-${r}`} x1={gx} y1={y} x2={gx + gw} y2={y} stroke="transparent" strokeWidth={14} style={{ cursor: "ns-resize" }} onPointerDown={(e) => { dragRef.current = { axis: "h", index: r - 1 }; (e.target as Element).setPointerCapture?.(e.pointerId); }} />);
  }

  function toLocal(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: ((e.clientX - rect.left) / rect.width) * VIEW_W, y: ((e.clientY - rect.top) / rect.height) * VIEW_H };
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = dragRef.current;
    if (!d || !onLayoutChange) return;
    const p = toLocal(e); if (!p) return;
    if (d.axis === "v") {
      const ratio = Math.min(0.95, Math.max(0.05, (p.x - gx) / gw));
      const arr = v.slice(1, -1); arr[d.index] = ratio;
      for (let i = 1; i < arr.length; i++) if (arr[i] - arr[i - 1] < 0.06) arr[i] = arr[i - 1] + 0.06;
      for (let i = arr.length - 2; i >= 0; i--) if (arr[i + 1] - arr[i] < 0.06) arr[i] = arr[i + 1] - 0.06;
      onLayoutChange({ ...layout, vSplits: arr.map((x) => Math.min(0.94, Math.max(0.06, x))) });
    } else {
      const ratio = Math.min(0.95, Math.max(0.05, (p.y - gy) / gh));
      const arr = hr.slice(1, -1); arr[d.index] = ratio;
      for (let i = 1; i < arr.length; i++) if (arr[i] - arr[i - 1] < 0.06) arr[i] = arr[i - 1] + 0.06;
      for (let i = arr.length - 2; i >= 0; i--) if (arr[i + 1] - arr[i] < 0.06) arr[i] = arr[i + 1] - 0.06;
      onLayoutChange({ ...layout, hSplits: arr.map((x) => Math.min(0.94, Math.max(0.06, x))) });
    }
  }
  function onPointerUp() { dragRef.current = null; }

  function onDoubleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!editable || !onLayoutChange) return;
    const rect = svgRef.current?.getBoundingClientRect(); if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const py = ((e.clientY - rect.top) / rect.height) * VIEW_H;
    if (px < gx || px > gx + gw || py < gy || py > gy + gh) return;
    const rx = (px - gx) / gw; const ry = (py - gy) / gh;
    const nearV = v.some((s, i) => i > 0 && i < v.length - 1 && Math.abs(rx - s) < 0.04);
    const nearH = hr.some((s, i) => i > 0 && i < hr.length - 1 && Math.abs(ry - s) < 0.04);
    if (nearV) {
      const idx = v.slice(1, -1).reduce((best, s, i) => Math.abs(rx - s) < Math.abs(rx - v[best + 1]) ? i : best, 0);
      const arr = v.slice(1, -1).filter((_, i) => i !== idx);
      onLayoutChange({ ...layout, cols: Math.max(1, cols - 1), vSplits: arr.length ? arr : undefined }); return;
    }
    if (nearH) {
      const idx = hr.slice(1, -1).reduce((best, s, i) => Math.abs(ry - s) < Math.abs(ry - hr[best + 1]) ? i : best, 0);
      const arr = hr.slice(1, -1).filter((_, i) => i !== idx);
      onLayoutChange({ ...layout, rows: Math.max(1, rows - 1), hSplits: arr.length ? arr : undefined }); return;
    }
    const colIdx = v.findIndex((s, i) => i < v.length - 1 && rx >= s && rx <= v[i + 1]);
    const rowIdx = hr.findIndex((s, i) => i < hr.length - 1 && ry >= s && ry <= hr[i + 1]);
    const colMid = colIdx >= 0 ? (v[colIdx] + v[colIdx + 1]) / 2 : rx;
    const rowMid = rowIdx >= 0 ? (hr[rowIdx] + hr[rowIdx + 1]) / 2 : ry;
    if (Math.abs(rx - colMid) >= Math.abs(ry - rowMid)) {
      const arr = [...v.slice(1, -1), rx].sort((a, b) => a - b); onLayoutChange({ ...layout, cols: cols + 1, vSplits: arr });
    } else {
      const arr = [...hr.slice(1, -1), ry].sort((a, b) => a - b); onLayoutChange({ ...layout, rows: rows + 1, hSplits: arr });
    }
  }

  const dimY = y0 + dh + 26;
  const dimX = x0 - 26;
  const outerPath = topPath(shape, x0, y0, dw, dh, risePx);
  const innerPath = topPath(shape, gx, gy, gw, gh, Math.max(0, risePx - face * 0.6));

  return (
    <div>
      <svg ref={svgRef} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Elevation drawing"
        style={{ touchAction: "none", cursor: editable ? "crosshair" : "default" }}
        onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onDoubleClick={onDoubleClick}>
        <defs>
          <clipPath id={clipId}><path d={innerPath} /></clipPath>
        </defs>
        <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="var(--canvas)" />
        <path d={outerPath} fill={frame} stroke="rgba(0,0,0,.55)" strokeWidth={1.5} />
        <path d={innerPath} fill={innerCol} stroke="rgba(0,0,0,.35)" />
        <g clipPath={`url(#${clipId})`}>
          {panes}
          {dividers}
        </g>
        <line x1={x0} y1={dimY} x2={x0 + dw} y2={dimY} stroke="var(--dim)" />
        <line x1={x0} y1={dimY - 4} x2={x0} y2={dimY + 4} stroke="var(--dim)" />
        <line x1={x0 + dw} y1={dimY - 4} x2={x0 + dw} y2={dimY + 4} stroke="var(--dim)" />
        <text x={x0 + dw / 2} y={dimY + 14} fill="var(--dim)" fontSize={11} textAnchor="middle">{num(w)} mm · {feetInches(w)}</text>
        {roughOpening.adjusted && <text x={x0 + dw / 2} y={dimY + 28} fill="var(--accent)" fontSize={10} textAnchor="middle">RO {num(roughOpening.width)} × {num(roughOpening.height)} mm</text>}
        <line x1={dimX} y1={y0} x2={dimX} y2={y0 + dh} stroke="var(--dim)" />
        <line x1={dimX - 4} y1={y0} x2={dimX + 4} y2={y0} stroke="var(--dim)" />
        <line x1={dimX - 4} y1={y0 + dh} x2={dimX + 4} y2={y0 + dh} stroke="var(--dim)" />
        <text x={dimX - 7} y={y0 + dh / 2} fill="var(--dim)" fontSize={11} textAnchor="middle" transform={`rotate(-90 ${dimX - 7} ${y0 + dh / 2})`}>{num(h)} mm</text>
        <text x={VIEW_W - 8} y={16} fill="var(--dim)" fontSize={10} textAnchor="end">{cols} × {rows} lite · {shape}</text>
      </svg>
      {editable && <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>Double-click inside to add/remove a split. Drag a mullion/transom to move it. Shape: {shape}.</div>}
    </div>
  );
}
