/**
 * Quote assembly.
 *
 * A quote line freezes the design. Once a quote is sent, changing the catalogue or the
 * price list must not silently rewrite it — that is how a fabricator ends up arguing with
 * a customer about a number nobody can reproduce.
 */

import { buildGeometry, roughOpening } from "./geometry.ts";
import { priceDesign } from "./pricing.ts";
import { checkDesign } from "./validation.ts";
import type { Design, QuoteLineSnapshot, Warning } from "./types.ts";

export interface QuoteOptions {
  /** VAT rate, percent. Philippine standard is 12. */
  vatRate?: number;
  /** Order-level discount, percent, applied after line totals. */
  discountPercent?: number;
}

export interface Quote {
  lines: QuoteLineSnapshot[];
  warnings: Warning[];
  /** Sum of line totals, before discount and VAT. */
  net: number;
  discount: number;
  /** Net minus discount. */
  taxable: number;
  vat: number;
  total: number;
}

export function snapshotLine(design: Design): QuoteLineSnapshot {
  const geometry = buildGeometry(design);
  const ro = roughOpening(design, geometry.series);
  const price = priceDesign(design, geometry);
  return {
    design,
    geometry,
    roughOpening: ro,
    price,
    unitPrice: price.perUnit,
    quantity: design.quantity,
    lineTotal: price.total,
  };
}

export function buildQuote(designs: Design[], options: QuoteOptions = {}): Quote {
  const vatRate = options.vatRate ?? 12;
  const discountPercent = options.discountPercent ?? 0;

  const lines = designs.map((design) => snapshotLine(design));
  const warnings = lines.flatMap((line) => checkDesign(line.design, line.geometry));

  const net = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const discount = net * (discountPercent / 100);
  const taxable = net - discount;
  const vat = taxable * (vatRate / 100);

  return { lines, warnings, net, discount, taxable, vat, total: taxable + vat };
}
