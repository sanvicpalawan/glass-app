import { RATES } from "./catalogue.ts";
import { isSliding, widestPanel } from "./geometry.ts";
import type { Design, Geometry, Warning } from "./types.ts";

export function checkDesign(design: Design, geometry: Geometry): Warning[] {
  const out: Warning[] = [];
  const { series } = geometry;
  const { width, height } = design;

  if (width < 300 || height < 300) out.push({ code: "too-small", message: `Smaller than 300 mm. Check the ${series.name} minimum.` });
  if (width > 6000) out.push({ code: "too-wide", message: "Over 6000 mm wide — split into multiple units." });

  if (isSliding(design.operation)) {
    const pw = widestPanel(design, geometry);
    if (pw > series.maxPanelWidth) out.push({ code: "panel-too-wide", message: `Panel is ${Math.round(pw)} mm — limit for this series is ${series.maxPanelWidth} mm.` });
  }
  if (height > series.maxHeight) out.push({ code: "too-tall", message: `Over ${series.maxHeight} mm high. Needs a transom or heavier series.` });
  if (width / height > 4) out.push({ code: "aspect", message: "Very wide and shallow. Check wind load." });
  if (design.glass === "clear" && (height > 1800 || width > 1800)) out.push({ code: "glass-safety", message: "Large clear glass — tempered or laminated is safer." });
  if (design.hardware === "none" && geometry.leaves > 0) out.push({ code: "no-hardware", message: "Opening unit with no hardware — quote will be under-priced." });
  if (geometry.panes.some((p) => p.width <= 0 || p.height <= 0)) out.push({ code: "negative-glass", message: "Glass size came out zero or negative. Unit too small for this series." });
  if (design.operation === "door_sliding2" || design.operation === "door_patio" || design.operation === "door_hinged") {
    if (height < 2000) out.push({ code: "door-height", message: "Door under 2000 mm high — confirm clear opening." });
  }
  return out;
}
