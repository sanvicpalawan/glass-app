/**
 * DXF writer (AutoCAD R12 ASCII).
 *
 * R12 because every saw, CAD package and nesting tool reads it, including the old
 * ones in a fabricator's office. One LINE entity per edge; no blocks, no layers beyond 0.
 *
 * Y is flipped so the drawing is right way up in CAD: our origin is top-left, CAD's is
 * bottom-left.
 */

import type { Design, Geometry, RoughOpening } from "./types.ts";

type Pt = [number, number];

function line(a: Pt, b: Pt): string {
  return [
    "0", "LINE",
    "8", "0",
    "10", a[0].toFixed(2),
    "20", a[1].toFixed(2),
    "30", "0",
    "11", b[0].toFixed(2),
    "21", b[1].toFixed(2),
    "31", "0",
  ].join("\n");
}

function rect(x: number, y: number, w: number, h: number): string[] {
  return [
    line([x, y], [x + w, y]),
    line([x + w, y], [x + w, y + h]),
    line([x + w, y + h], [x, y + h]),
    line([x, y + h], [x, y]),
  ];
}

/** Build a DXF of the elevation. Coordinates in mm, origin at the bottom-left of the unit. */
export function toDxf(design: Design, geometry: Geometry, ro: RoughOpening): string {
  const { width: w, height: h } = design;
  const face = geometry.series.face;
  const stile = geometry.series.stile;
  const body: string[] = [];

  // outer frame
  body.push(...rect(0, 0, w, h));
  // inner frame line
  body.push(...rect(face, face, w - 2 * face, h - 2 * face));

  // panel / mullion dividers
  if (geometry.panels > 1) {
    const span = w - 2 * face;
    const step = span / geometry.panels;
    for (let i = 1; i < geometry.panels; i += 1) {
      const x = face + i * step;
      body.push(line([x, face], [x, h - face]));
    }
  }

  // glass panes, laid out left to right
  const innerW = w - 2 * face;
  const step = innerW / Math.max(1, geometry.panes.length);
  geometry.panes.forEach((p, i) => {
    const x = face + i * step + stile;
    const y = face + stile;
    if (p.width > 0 && p.height > 0) body.push(...rect(x, y, p.width, p.height));
  });

  // rough opening marker, centred on the unit
  if (ro.adjusted) {
    body.push(...rect(-(ro.width - w) / 2, -(ro.height - h) / 2, ro.width, ro.height));
  }

  const header = [
    "0", "SECTION", "2", "HEADER",
    "9", "$ACADVER", "1", "AC1009",
    "9", "$INSUNITS", "70", "4",
    "9", "$EXTMIN", "10", "0", "20", "0",
    "9", "$EXTMAX", "10", String(ro.width), "20", String(ro.height),
    "0", "ENDSEC",
    "0", "SECTION", "2", "ENTITIES",
  ].join("\n");

  return `${header}\n${body.join("\n")}\n0\nENDSEC\n0\nEOF\n`;
}

export function dxfFilename(design: Design): string {
  return `fenestra-${design.operation}-${design.width}x${design.height}.dxf`;
}
