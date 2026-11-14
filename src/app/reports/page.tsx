"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { peso } from "@/domain/format";

export default function ReportsPage() {
  const { quotes, orders, invoices, inventory, customers } = useStore();

  const stats = useMemo(() => {
    const quoteTotal = quotes.reduce((s,q)=>s+q.total,0);
    const won = quotes.filter(q=>q.status==="won");
    const wonTotal = won.reduce((s,q)=>s+q.total,0);
    const pipeline = quotes.filter(q=>q.status==="draft"||q.status==="sent").reduce((s,q)=>s+q.total,0);
    const invPaid = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+i.total,0);
    const invOutstanding = invoices.filter(i=>i.status==="sent"||i.status==="overdue").reduce((s,i)=>s+i.total,0);
    const byStatus = orders.reduce((m,o)=>{m[o.status]=(m[o.status]||0)+1; return m;}, {} as Record<string,number>);
    const lowStock = inventory.filter(i=>i.qty<=i.minQty);
    const topCustomers = Object.entries(quotes.reduce((m,q)=>{const k=q.customerName||"Unknown"; m[k]=(m[k]||0)+q.total; return m;}, {} as Record<string,number>)).sort((a,b)=>b[1]-a[1]).slice(0,8);
    return { quoteTotal, wonCount: won.length, wonTotal, pipeline, invPaid, invOutstanding, byStatus, lowStock, topCustomers };
  }, [quotes, orders, invoices, inventory]);

  const card = (label:string, value:string) => (
    <div className="card" style={{padding:16}}><div style={{fontSize:11,color:"var(--dim)",textTransform:"uppercase",letterSpacing:".08em"}}>{label}</div><div style={{fontSize:22,fontWeight:700,marginTop:6}}>{value}</div></div>
  );

  return (
    <main className="page" style={{ display: "grid", gap: 18 }}>
      <h2 style={{ margin: 0 }}>Reports</h2>
      <div className="grid-4">
        {card("Quotes (total value)", peso(stats.quoteTotal))}
        {card("Won quotes", `${stats.wonCount} · ${peso(stats.wonTotal)}`)}
        {card("Pipeline (draft/sent)", peso(stats.pipeline))}
        {card("Invoices paid", peso(stats.invPaid))}
        {card("Invoices outstanding", peso(stats.invOutstanding))}
        {card("Orders", String(orders.length))}
        {card("Customers", String(customers.length))}
        {card("Low stock items", String(stats.lowStock.length))}
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>Orders by status</h3>
          {Object.keys(stats.byStatus).length===0 ? <p style={{color:"var(--dim)"}}>No orders.</p> : (
            <div className="table-wrap"><table><thead><tr><th>Status</th><th className="num">Count</th></tr></thead>
            <tbody>{Object.entries(stats.byStatus).map(([k,v])=>(<tr key={k}><td style={{textTransform:"capitalize"}}>{k.replace("_"," ")}</td><td className="num">{v}</td></tr>))}</tbody></table></div>
          )}
        </section>
        <section className="card">
          <h3>Top customers (quoted)</h3>
          {stats.topCustomers.length===0 ? <p style={{color:"var(--dim)"}}>No data.</p> : (
            <div className="table-wrap"><table><thead><tr><th>Customer</th><th className="num">Quoted value</th></tr></thead>
            <tbody>{stats.topCustomers.map(([name,val])=>(<tr key={name}><td>{name}</td><td className="num">{peso(val)}</td></tr>))}</tbody></table></div>
          )}
        </section>
      </div>

      <section className="card">
        <h3>Low stock alerts</h3>
        {stats.lowStock.length===0 ? <p style={{color:"var(--dim)"}}>All stock levels OK.</p> : (
          <div className="table-wrap"><table><thead><tr><th>SKU</th><th>Name</th><th className="num">On hand</th><th className="num">Min</th></tr></thead>
          <tbody>{stats.lowStock.map(i=>(<tr key={i.id}><td>{i.sku}</td><td>{i.name}</td><td className="num" style={{color:"var(--warn)"}}>{i.qty} {i.unit}</td><td className="num">{i.minQty}</td></tr>))}</tbody></table></div>
        )}
      </section>

      <div className="bar"><button className="btn" onClick={()=>window.print()}>Print report</button></div>
    </main>
  );
}
