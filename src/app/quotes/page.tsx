"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { peso } from "@/domain/format";

export default function QuotesPage() {
  const { quotes, updateQuoteStatus, removeQuote, createOrderFromQuote, createInvoiceFromQuote } = useStore();

  return (
    <main className="page">
      <div className="bar" style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Quotes</h2>
        <Link href="/" className="btn primary" style={{ textDecoration: "none" }}>+ New quote</Link>
      </div>

      <section className="card">
        {quotes.length === 0 ? (
          <p style={{ color: "var(--dim)", margin: 0 }}>No saved quotes yet. Configure a unit, add lines, then save from the configurator.</p>
        ) : (
          <div className="table-wrap"><table>
            <thead>
              <tr>
                <th>Number</th><th>Customer</th><th>Status</th><th>Date</th><th className="num">Lines</th><th className="num">Total</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td><b>{q.number}</b></td>
                  <td>{q.customerName || "—"}</td>
                  <td>
                    <select value={q.status} onChange={(e) => void updateQuoteStatus(q.id, e.target.value as any)} style={{ minWidth: 110, padding: "4px 6px" }}>
                      <option value="draft">Draft</option><option value="sent">Sent</option><option value="won">Won</option><option value="lost">Lost</option>
                    </select>
                  </td>
                  <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td className="num">{q.lines.length}</td>
                  <td className="num">{peso(q.total)}</td>
                  <td className="bar" style={{ flexWrap: "wrap" }}>
                    <Link href={`/quotes/${q.id}`} className="btn" style={{ textDecoration: "none" }}>View</Link>
                    <button className="btn" onClick={() => void createOrderFromQuote(q.id)}>→ Order</button>
                    <button className="btn" onClick={() => void createInvoiceFromQuote(q.id)}>Invoice</button>
                    <button className="btn" onClick={() => void removeQuote(q.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </main>
  );
}
