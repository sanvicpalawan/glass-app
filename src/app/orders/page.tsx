"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { peso } from "@/domain/format";

const ORDER_FLOW = ["confirmed", "in_production", "ready", "installed", "closed"] as const;

export default function OrdersPage() {
  const { quotes, orders, createOrderFromQuote, updateOrder, createInvoiceFromOrder } = useStore();
  const wonQuotes = quotes.filter((q) => q.status === "won" && !orders.some(o => o.quoteId === q.id));

  return (
    <main className="page" style={{ display: "grid", gap: 18 }}>
      <div className="bar">
        <h2 style={{ margin: 0, fontSize: 16 }}>Orders / Job flow</h2>
        <span style={{ color: "var(--dim)", fontSize: 12 }}>Quote → Order → Production → Install → Invoice</span>
      </div>

      <section className="card">
        <h3>Won quotes ready to become orders</h3>
        {wonQuotes.length === 0 ? <p style={{ color: "var(--dim)", margin: 0 }}>No won quotes waiting. Mark a quote as Won on the Quotes page.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Quote</th><th>Customer</th><th className="num">Total</th><th>Action</th></tr></thead>
            <tbody>{wonQuotes.map(q => (
              <tr key={q.id}><td><b>{q.number}</b></td><td>{q.customerName||"—"}</td><td className="num">{peso(q.total)}</td>
                <td><button className="btn primary" onClick={()=>void createOrderFromQuote(q.id)}>Create order</button></td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="card">
        <h3>Orders ({orders.length})</h3>
        {orders.length === 0 ? <p style={{ color: "var(--dim)", margin: 0 }}>No orders yet.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Order</th><th>Quote</th><th>Customer</th><th>Status</th><th>Due</th><th className="num">Total</th><th>Actions</th></tr></thead>
            <tbody>{orders.map(o => (
              <tr key={o.id}>
                <td><b>{o.number}</b></td><td>{o.quoteNumber||"—"}</td><td>{o.customerName||"—"}</td>
                <td>
                  <select value={o.status} onChange={(e)=>void updateOrder(o.id,{status:e.target.value as any})} style={{minWidth:140,padding:"4px 6px"}}>
                    {ORDER_FLOW.map(s=> <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                  </select>
                </td>
                <td><input type="date" value={(o.dueDate||"").slice(0,10)} onChange={(e)=>void updateOrder(o.id,{dueDate:e.target.value})} style={{padding:"4px 6px"}} /></td>
                <td className="num">{peso(o.total)}</td>
                <td className="bar" style={{flexWrap:"wrap"}}>
                  <Link href={`/orders/${o.id}`} className="btn" style={{textDecoration:"none"}}>View</Link>
                  <button className="btn" onClick={()=>void createInvoiceFromOrder(o.id)}>Invoice</button>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </main>
  );
}
