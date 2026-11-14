"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { peso, num } from "@/domain/format";
import { OPERATION_LABELS } from "@/domain/catalogue";

export default function InvoiceDetail() {
  const params = useParams<{ id: string }>();
  const { invoices, loading, settings } = useStore();
  const inv = invoices.find((x) => x.id === params.id);

  if (loading) return <main className="page"><div className="card">Loading…</div></main>;
  if (!inv) return <main className="page"><div className="card">Invoice not found. <Link href="/invoices">Back</Link></div></main>;

  const c = settings.company; const invs = settings.invoice; const ds = settings.documents;
  const due = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : new Date(new Date(inv.createdAt).getTime() + (invs.dueDays || 30) * 86400000).toLocaleDateString();
  const mailSubject = (settings.email.invoiceSubject || "Invoice {{number}} from {{company}}").replace("{{number}}", inv.number).replace("{{company}}", c.name || "Fenestra");
  const mailto = `mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(`Invoice ${inv.number}\nCustomer: ${inv.customerName || "—"}\nTotal: ${peso(inv.total)}\nDue: ${due}\n\n${c.name || ""}`)}`;

  return (
    <main className="page" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="bar" style={{ marginBottom: 14 }}>
        <Link href="/invoices" className="btn" style={{ textDecoration: "none" }}>← Invoices</Link>
        <button className="btn primary" onClick={() => window.print()}>Print / Save PDF</button>
        <a className="btn" href={mailto} style={{ textDecoration: "none" }}>Email</a>
      </div>
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", borderBottom: "1px solid var(--line)", paddingBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              {ds.showLogoOnDocs && c.logoUrl ? <img src={c.logoUrl} alt={c.name} style={{ height: 40, objectFit: "contain" }} /> : null}
              <div>
                <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700 }}>{c.name || "Fenestra"}</div>
                <div style={{ fontSize: 12, color: "var(--dim)" }}>{c.address}</div>
                <div style={{ fontSize: 12, color: "var(--dim)" }}>{[c.phone,c.email,c.website].filter(Boolean).join(" · ")}</div>
              </div>
            </div>
            <h2 style={{ margin: "10px 0 4px", fontSize: 26 }}>Invoice {inv.number}</h2>
            <div style={{ color: "var(--dim)", fontSize: 12 }}>Date: {new Date(inv.createdAt).toLocaleString()} · Status: <b style={{ textTransform: "capitalize" }}>{inv.status}</b></div>
            <div style={{ color: "var(--dim)", fontSize: 12 }}>Due: {due}{inv.orderNumber ? ` · Order: ${inv.orderNumber}` : ""}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--dim)", textTransform: "uppercase" }}>Bill to</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{inv.customerName || "—"}</div>
          </div>
        </div>
        <h3 style={{ margin: "14px 0 8px", fontSize: 12, textTransform: "uppercase", color: "var(--dim)" }}>Items</h3>
        <div className="table-wrap"><table>
          <thead><tr><th>#</th><th>Description</th><th className="num">Size</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Total</th></tr></thead>
          <tbody>
            {inv.lines.map((l, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td><div style={{ fontWeight: 600 }}>{l.description}</div><div style={{ color: "var(--dim)", fontSize: 12 }}>{OPERATION_LABELS[l.design.operation]} · {l.design.glass}</div></td>
                <td className="num">{num(l.design.width)}×{num(l.design.height)}</td>
                <td className="num">{l.quantity}</td>
                <td className="num">{peso(l.unitPrice)}</td>
                <td className="num">{peso(l.lineTotal)}</td>
              </tr>
            ))}
            <tr className="sub"><td colSpan={5}>Net</td><td className="num">{peso(inv.net)}</td></tr>
            <tr><td colSpan={5}>{invs.taxLabel} {qVat(inv)}</td><td className="num">{peso(inv.vat)}</td></tr>
          </tbody>
        </table></div>
        <div className="total"><span>Amount due</span><b>{peso(inv.total)}</b></div>
        {invs.depositPercent > 0 && <p style={{ marginTop: 8, color: "var(--dim)", fontSize: 12 }}>Deposit ({invs.depositPercent}%): <b style={{color:"var(--txt)"}}>{peso(inv.total * invs.depositPercent / 100)}</b> · Balance: <b style={{color:"var(--txt)"}}>{peso(inv.total - inv.total * invs.depositPercent / 100)}</b></p>}
        {invs.paymentTerms && <p style={{ marginTop: 8 }}><b>Payment terms:</b> {invs.paymentTerms}</p>}
        {invs.bankDetails && <p style={{ whiteSpace: "pre-wrap" }}><b>Payment details:</b><br />{invs.bankDetails}</p>}
        {inv.notes && <p style={{ color: "var(--dim)" }}><b>Notes:</b> {inv.notes}</p>}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: 11, color: "var(--dim)" }}>
          {ds.footerLegal}{invs.lateFeeText ? ` · ${invs.lateFeeText}` : ""}
        </div>
      </section>
    </main>
  );
}

function qVat(inv: any) {
  if (inv.vatRate != null) return `${inv.vatRate}%`;
  if (inv.net) return `${((inv.vat / inv.net) * 100).toFixed(0)}%`;
  return "";
}
