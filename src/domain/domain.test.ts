import assert from "node:assert/strict";
import test from "node:test";

import { RATES, SERIES, getSeries } from "./catalogue.ts";
import { buildGeometry, barsFor, panelCount, roughOpening, widestPanel } from "./geometry.ts";
import { priceDesign } from "./pricing.ts";
import { checkDesign } from "./validation.ts";
import { buildQuote, snapshotLine } from "./quote.ts";
import { toDxf } from "./dxf.ts";
import { feetInches } from "./format.ts";
import type { Design } from "./types.ts";

function design(overrides: Partial<Design> = {}): Design {
  return {
    operation: "sliding2",
    seriesId: "alu-sld-70",
    itemType: "custom",
    width: 1800,
    height: 1500,
    quantity: 1,
    measureType: "std",
    colourExt: "WH",
    colourInt: "WH",
    glass: "lam",
    hardware: "std",
    screen: false,
    rush: false,
    margin: 35,
    ...overrides,
  };
}

test("rough opening follows the series rule", () => {
  const d = design();
  const std = roughOpening(d);
  assert.equal(std.width, 1813);
  assert.equal(std.height, 1513);
  assert.equal(std.adjusted, true);
  const masonry = roughOpening(design({ measureType: "masonry" }));
  assert.equal(masonry.width, 1902);
  assert.equal(masonry.height, 1564);
  const none = roughOpening(design({ measureType: "none" }));
  assert.equal(none.width, 1800);
  assert.equal(none.adjusted, false);
});

test("panel counts for key operations", () => {
  assert.deepEqual(panelCount("sliding2"), { panels: 2, leaves: 2 });
  assert.deepEqual(panelCount("sliding4"), { panels: 4, leaves: 4 });
  assert.deepEqual(panelCount("fixed"), { panels: 1, leaves: 0 });
  assert.deepEqual(panelCount("casement2"), { panels: 2, leaves: 2 });
  assert.deepEqual(panelCount("door_patio"), { panels: 2, leaves: 2 });
});

test("a two-panel slider produces two panes and a positive cut list", () => {
  const geo = buildGeometry(design());
  assert.equal(geo.panes.length, 2);
  assert.equal(geo.panels, 2);
  assert.ok(geo.profileLength > 0);
  assert.ok(geo.glassArea > 0);
  for (const m of geo.members) {
    assert.ok(m.length > 0, `${m.name} has non-positive length`);
    assert.ok(m.quantity > 0, `${m.name} has non-positive quantity`);
  }
});

test("glass fits inside the unit for common operations", () => {
  for (const op of ["sliding2", "sliding3", "casement1", "casement2", "awning", "fixed", "door_patio"] as const) {
    const geo = buildGeometry(design({ operation: op }));
    for (const p of geo.panes) {
      assert.ok(p.width < 1800, `${op}: pane wider than unit`);
      assert.ok(p.height < 1500, `${op}: pane taller than unit`);
      assert.ok(p.width > 0 && p.height > 0, `${op}: non-positive pane`);
    }
  }
});

test("pricing is additive and total equals subtotal plus margin", () => {
  const d = design();
  const price = priceDesign(d, buildGeometry(d));
  const lineSum = price.lines.reduce((s, l) => s + l.amount, 0);
  assert.ok(Math.abs(lineSum - price.subtotal) < 0.01);
  assert.ok(Math.abs(price.subtotal + price.margin - price.total) < 0.01);
});

test("stock cheaper than custom; quantity scales", () => {
  const custom = priceDesign(design(), buildGeometry(design()));
  const stock = priceDesign(design({ itemType: "stock" }), buildGeometry(design({ itemType: "stock" })));
  assert.ok(stock.total < custom.total);
  const one = priceDesign(design({ quantity: 1 }), buildGeometry(design({ quantity: 1 })));
  const ten = priceDesign(design({ quantity: 10 }), buildGeometry(design({ quantity: 10 })));
  assert.ok(Math.abs(ten.total - one.total * 10) < 1);
});

test("rush and dual colour raise the price", () => {
  const base = priceDesign(design(), buildGeometry(design()));
  const rush = priceDesign(design({ rush: true }), buildGeometry(design({ rush: true })));
  assert.ok(rush.subtotal > base.subtotal);
  const dual = priceDesign(design({ colourInt: "BK" }), buildGeometry(design({ colourInt: "BK" })));
  assert.equal(dual.twoTone, true);
  assert.ok(dual.subtotal > base.subtotal);
});

test("validation catches undersized and oversized panels", () => {
  const small = checkDesign(design({ width: 200, height: 200 }), buildGeometry(design({ width: 200, height: 200 })));
  assert.ok(small.some((w) => w.code === "too-small"));
  const d = design({ operation: "sliding2", seriesId: "alu-cas-50", width: 4000, height: 1500 });
  const geo = buildGeometry(d);
  const w = checkDesign(d, geo);
  assert.ok(w.some((x) => x.code === "panel-too-wide" || x.code === "too-tall" || x.code === "too-wide"));
});

test("healthy design has no warnings", () => {
  const d = design();
  assert.deepEqual(checkDesign(d, buildGeometry(d)), []);
});

test("DXF and quote work", () => {
  const d = design();
  const geo = buildGeometry(d);
  const out = toDxf(d, geo, roughOpening(d));
  assert.ok(out.includes("ENTITIES") && out.trimEnd().endsWith("EOF"));
  const quote = buildQuote([design(), design({ quantity: 2 })], { vatRate: 12, discountPercent: 10 });
  assert.equal(quote.lines.length, 2);
  assert.ok(Math.abs(quote.total - (quote.taxable + quote.vat)) < 0.01);
  const line = snapshotLine(d);
  const orig = line.lineTotal;
  d.margin = 90;
  assert.equal(line.lineTotal, orig);
});

test("every series can build its first supported operation", () => {
  for (const s of SERIES) {
    const op = s.operations[0];
    const geo = buildGeometry(design({ seriesId: s.id, operation: op }));
    assert.ok(geo.members.length > 0, `${s.id}/${op} no members`);
    assert.ok(geo.panes.length > 0, `${s.id}/${op} no panes`);
  }
});

test("feet-and-inches formatting", () => {
  assert.equal(feetInches(304.8), `1'-0"`);
});
