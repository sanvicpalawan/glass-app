/**
 * Pricing engine. Cost-up: profile + glass + hardware + screen + labour + options, then margin.
 * All rates come from the catalogue; option adjustments come from the option tree.
 */

import { ITEM_TYPES, RATES, getColour } from "./catalogue.ts";
import { optionsAdjustment } from "./options.ts";
import type { Design, Geometry, Price, PriceLine } from "./types.ts";

export function priceDesign(design: Design, geometry: Geometry): Price {
  const { series } = geometry;
  const itemRule = ITEM_TYPES[design.itemType];
  const qty = design.quantity;

  const area = (design.width * design.height) / 1e6;
  const totalArea = area * qty;
  const profileMetres = (geometry.profileLength / 1000) * qty;

  const ext = getColour(design.colourExt);
  const intC = getColour(design.colourInt);
  const twoTone = design.colourExt !== design.colourInt;

  let colourFactor = 1 + ext.adjust + intC.adjust;
  if (ext.custom || intC.custom) colourFactor += RATES.customColourUplift;
  if (twoTone) colourFactor += RATES.twoToneUplift;

  const profile = profileMetres * series.rate * itemRule.profile * colourFactor;
  const glass = geometry.glassArea * qty * RATES.glass[design.glass] * itemRule.glass;
  const hardware = geometry.leaves * RATES.hardware[design.hardware] * qty * itemRule.hardware;
  const screen = design.screen ? geometry.leaves * RATES.screen * qty : 0;
  const labour = totalArea * RATES.labour * itemRule.labour;

  const lines: PriceLine[] = [
    { label: `Profile (${profileMetres.toFixed(1)} m)`, amount: profile },
    { label: `Glass (${(geometry.glassArea * qty).toFixed(2)} m²)`, amount: glass },
    { label: "Hardware", amount: hardware },
    { label: "Insect screen", amount: screen },
    { label: "Labour & install", amount: labour },
  ];

  const base = profile + glass + hardware + screen + labour;
  const opt = optionsAdjustment(design.options, base);
  for (const ol of opt.lines) lines.push(ol);

  const beforeRush = base + opt.total;
  const rush = design.rush ? beforeRush * RATES.rushUplift : 0;
  if (rush > 0) {
    const pct = Math.round(RATES.rushUplift * 100);
    lines.push({ label: `Rush order +${pct}%`, amount: rush });
  }

  const subtotal = beforeRush + rush;
  const margin = subtotal * (design.margin / 100);
  const total = subtotal + margin;

  return {
    lines,
    subtotal,
    margin,
    total,
    perUnit: total / qty,
    perSquareMetre: totalArea > 0 ? total / totalArea : 0,
    area: totalArea,
    profileMetres,
    twoTone,
  };
}
