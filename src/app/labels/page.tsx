"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { num } from "@/domain/format";

function barcode(text: string) {
  // simple visual barcode-like bars (printable identifier)
  let bars: number[] = [];
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); bars.push(1 + (c % 3), 2 + ((c >> 2) % 3)); }
  return bars;
}

function LabelsInner() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const { orders, quotes } = useStore();
  const activeOrders = orderId ? orders.filter(o=>o.id===orderId) : orders.filter(o=>o.status!=="closed");
  const items = useMemo(()=> activeOrders.flatMap(o => o.lines.flatMap((l, li) => Array.from({length: l.quantity}, (_, qi) => ({
    ref: `${o.number}-${li+1}${l.quantity>1?`-${qi+1}`:""}`, order: o.number, customer: o.customerName||"", desc: l.description,
    w: l.design.width, h: l.design.height, series: l.design.seriesId, glass: l.design.glass,
  })))), [activeOrders]);

  return (
    <main className="page">
      <div className="bar" style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Production labels / barcodes</h2>
        <button className="btn primary" onClick={()=>window.print()}>Print labels</button>
      </div>
      {items.length===0 ? <section className="card"><p style={{color:"var(--dim)",margin:0}}>No items. Create an order first, or pass ?order=&lt;id&gt;.</p></section> : (
        <div className="grid-3">
          {items.map((it, i) => (
            <div key={i} className="card" style={{padding:12,breakInside:"avoid",background:"#fff",color:"#111",border:"1px dashed #999"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><b>{it.order}</b><span>{it.customer}</span></div>
              <div style={{fontSize:16,fontWeight:700,margin:"4px 0"}}>{it.ref}</div>
              <div style={{fontSize:12}}>{it.desc}</div>
              <div style={{fontSize:13,margin:"4px 0"}}><b>{num(it.w)} × {num(it.h)} mm</b> · {it.series}</div>
              <div style={{fontSize:11,color:"#444"}}>Glass: {it.glass}</div>
              <div style={{display:"flex",alignItems:"end",gap:1,height:28,marginTop:6}} aria-label={`barcode ${it.ref}`}>
                {barcode(it.ref).map((w,bi)=>(<span key={bi} style={{display:"inline-block",width:Math.max(1,w),height:bi%2?28:18,background:bi%2?"#111":"#111",opacity:bi%2?1:0.6}} />))}
              </div>
              <div style={{fontSize:10,letterSpacing:2,marginTop:2}}>{it.ref}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function LabelsPage() { return <Suspense fallback={<main style={{padding:"18px 22px"}}>Loading…</main>}><LabelsInner /></Suspense>; }
