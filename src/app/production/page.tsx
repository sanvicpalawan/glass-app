"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { RATES, buildGeometry, nestCuts, batchPickList, toDxf } from "@/domain";
import { num } from "@/domain/format";

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "application/dxf" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

export default function ProductionPage() {
  const { orders, settings } = useStore();
  const active = orders.filter((o) => o.status === "confirmed" || o.status === "in_production" || o.status === "ready");

  const computed = useMemo(() => {
    const stockLen = settings.production.stockBarLength || RATES.stockBarLength;
    const kerf = settings.production.kerf ?? 3;
    const items = active.flatMap((o) => o.lines.map((l, i) => {
      const geo = buildGeometry(l.design);
      return { ref: `${o.number}-${i + 1}`, order: o.number, design: l.design, geometry: geo, qty: l.quantity, desc: l.description, customer: o.customerName || "" };
    }));
    const cutMap = new Map<string, { label: string; length: number; quantity: number }>();
    for (const it of items) for (const m of it.geometry.members) {
      const key = `${m.name}|${m.length}`; const q = m.quantity * it.qty;
      const prev = cutMap.get(key);
      if (prev) prev.quantity += q; else cutMap.set(key, { label: `${m.name} ${m.length}mm`, length: m.length, quantity: q });
    }
    const cuts = [...cutMap.values()];
    const nesting = nestCuts(cuts, stockLen, kerf);
    const pick = batchPickList(items.map((it) => ({ design: it.design, geometry: it.geometry, ref: it.ref })));
    return { items, nesting, pick, totalUnits: items.reduce((s, i) => s + i.qty, 0) };
  }, [active, settings.production.stockBarLength, settings.production.kerf]);

  function exportAllDxf() {
    computed.items.forEach((it, idx) => {
      const ro = { width: it.design.width, height: it.design.height, widthAdd: 0, heightAdd: 0, headExtra: 0, adjusted: false, label: "Standard" } as any;
      download(`${it.ref}.dxf`, toDxf(it.design, it.geometry, ro));
    });
  }

  return (
    <main className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="bar">
          <h2 style={{margin:0}}>Production</h2>
          <div className="bar">
            <Link href="/labels" className="btn" style={{textDecoration:"none"}}>Labels / barcodes</Link>
            <button className="btn" onClick={exportAllDxf} disabled={computed.items.length===0}>Export CNC/DXF (all)</button>
            <button className="btn" onClick={()=>window.print()}>Print</button>
          </div>
        </div>
        {active.length === 0 ? (
          <p style={{ color: "var(--dim)", margin: 0 }}>No active orders. Create an order from a won quote (Orders page) to generate production outputs.</p>
        ) : (
          <div className="table-wrap"><table>
            <thead><tr><th>Ref</th><th>Order</th><th>Customer</th><th>Description</th><th className="num">W×H</th><th className="num">Qty</th><th>Glass</th></tr></thead>
            <tbody>{computed.items.map((it, i) => (<tr key={i}><td><b>{it.ref}</b></td><td>{it.order}</td><td>{it.customer||"—"}</td><td>{it.desc}</td><td className="num">{num(it.design.width)}×{num(it.design.height)}</td><td className="num">{it.qty}</td><td>{it.design.glass}</td></tr>))}</tbody>
          </table></div>
        )}
      </section>

      {active.length > 0 && (<>
        <section className="card">
          <h2>Bar nesting / cutting optimisation (1D)</h2>
          <p style={{ color: "var(--dim)", marginTop: 0, fontSize: 12 }}>Stock {num(computed.nesting.stockLength)} mm · {computed.nesting.totalBars} bars · efficiency {(computed.nesting.efficiency * 100).toFixed(1)}% · waste {num(Math.round(computed.nesting.totalWaste))} mm</p>
          <div className="table-wrap"><table><thead><tr><th>Bar</th><th>Cuts</th><th className="num">Used</th><th className="num">Waste</th></tr></thead>
            <tbody>{computed.nesting.bars.slice(0, 40).map((b) => (<tr key={b.index}><td><b>#{b.index}</b></td><td style={{ fontSize: 12 }}>{b.cuts.map((c) => c.label).join(" | ")}</td><td className="num">{num(Math.round(b.used))}</td><td className="num">{num(Math.round(b.waste))}</td></tr>))}</tbody>
          </table></div>
        </section>
        <div className="grid-2">
          <section className="card">
            <h2>Glass batch / pick list</h2>
            {computed.pick.glass.length === 0 ? <p style={{ color: "var(--dim)" }}>No glass.</p> : computed.pick.glass.map((g) => (
              <div key={g.glass} style={{ marginBottom: 12 }}><h3 style={{ margin: "6px 0" }}>{g.glassLabel} — {g.totalPanes} panes · {g.totalArea.toFixed(3)} m²</h3>
                <div className="table-wrap"><table><thead><tr><th>Ref</th><th className="num">Size</th><th className="num">Qty</th></tr></thead>
                <tbody>{g.panes.slice(0, 25).map((p, i) => (<tr key={i}><td>{p.ref}</td><td className="num">{num(p.width)}×{num(p.height)}</td><td className="num">{p.qty}</td></tr>))}</tbody></table></div>
              </div>
            ))}
          </section>
          <section className="card">
            <h2>Hardware & screens pick list</h2>
            <div className="table-wrap"><table><thead><tr><th>Item</th><th className="num">Qty</th></tr></thead>
              <tbody>
                {computed.pick.hardware.map((h) => (<tr key={h.kind}><td>{h.label} hardware sets</td><td className="num">{h.qty}</td></tr>))}
                <tr><td>Insect screens</td><td className="num">{computed.pick.screens}</td></tr>
                <tr><td>Total units</td><td className="num">{computed.totalUnits}</td></tr>
              </tbody>
            </table></div>
          </section>
        </div>
      </>)}
    </main>
  );
}
