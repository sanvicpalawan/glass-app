"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { peso, num } from "@/domain/format";
import { OPERATION_LABELS } from "@/domain/catalogue";

export default function OrderDetail() {
  const params = useParams<{ id: string }>();
  const { orders, loading, createInvoiceFromOrder } = useStore();
  const o = orders.find((x) => x.id === params.id);
  if (loading) return <main style={{ padding: "18px 22px" }}><div className="card">Loading…</div></main>;
  if (!o) return <main style={{ padding: "18px 22px" }}><div className="card">Order not found. <Link href="/orders">Back</Link></div></main>;

  return (
    <main style={{ padding: "18px 22px", maxWidth: 900, margin: "0 auto" }}>
      <div className="bar" style={{ marginBottom: 14 }}>
        <Link href="/orders" className="btn" style={{ textDecoration: "none" }}>← Orders</Link>
        <button className="btn" onClick={() => window.print()}>Print</button>
        <button className="btn primary" onClick={() => void createInvoiceFromOrder(o.id)}>Create invoice</button>
        <Link href={`/labels?order=${o.id}`} className="btn" style={{ textDecoration: "none" }}>Labels</Link>
      </div>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Order {o.number} <span style={{fontSize:14,color:"var(--dim)",textTransform:"capitalize"}}>({o.status.replace("_"," ")})</span></h2>
        <p style={{color:"var(--dim)"}}>Quote: {o.quoteNumber||"—"} · Customer: {o.customerName||"—"} · Due: {o.dueDate ? new Date(o.dueDate).toLocaleDateString() : "—"}</p>
        <table>
          <thead><tr><th>#</th><th>Description</th><th className="num">Size</th><th className="num">Qty</th><th className="num">Total</th></tr></thead>
          <tbody>
            {o.lines.map((l,i)=>(<tr key={i}><td>{i+1}</td><td><b>{l.description}</b><div style={{fontSize:12,color:"var(--dim)"}}>{OPERATION_LABELS[l.design.operation]} · {l.design.glass}</div></td><td className="num">{num(l.design.width)}×{num(l.design.height)}</td><td className="num">{l.quantity}</td><td className="num">{peso(l.lineTotal)}</td></tr>))}
          </tbody>
        </table>
        <div className="total"><span>Total</span><b>{peso(o.total)}</b></div>
        {o.notes && <p><b>Notes:</b> {o.notes}</p>}
      </section>
    </main>
  );
}
