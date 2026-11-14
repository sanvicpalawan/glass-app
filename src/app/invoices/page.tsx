"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { peso } from "@/domain/format";

export default function InvoicesPage() {
  const { invoices, updateInvoice } = useStore();

  return (
    <main className="page">
      <div className="bar" style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Invoices</h2>
        <span style={{ color: "var(--dim)", fontSize: 12 }}>Create from an Order or Quote.</span>
      </div>
      <section className="card">
        {invoices.length === 0 ? <p style={{ color: "var(--dim)", margin: 0 }}>No invoices yet. Open an order or quote to create one.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Number</th><th>Customer</th><th>Status</th><th>Date</th><th className="num">Total</th><th>Actions</th></tr></thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><b>{inv.number}</b></td>
                  <td>{inv.customerName || "—"}</td>
                  <td>
                    <select value={inv.status} onChange={(e)=>void updateInvoice(inv.id,{status:e.target.value as any})} style={{minWidth:120,padding:"4px 6px"}}>
                      <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="void">Void</option>
                    </select>
                  </td>
                  <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td className="num">{peso(inv.total)}</td>
                  <td className="bar"><Link href={`/invoices/${inv.id}`} className="btn" style={{textDecoration:"none"}}>View / Print</Link></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </main>
  );
}
