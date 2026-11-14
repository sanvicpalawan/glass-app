"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { peso, num } from "@/domain/format";
import { OPERATION_LABELS, MATERIAL_LABELS, getSeries } from "@/domain/catalogue";

export default function QuoteDetail() {
  const params = useParams<{ id: string }>();
  const { quotes, loading, settings } = useStore();
  const q = quotes.find((x) => x.id === params.id);

  if (loading) return <main className="page"><div className="card">Loading quote…</div></main>;
  if (!q) return <main className="page"><div className="card">Quote not found. <Link href="/quotes">Back to quotes</Link></div></main>;

  const c = settings.company;
  const qs = settings.quote;
  const ds = settings.documents;
  const validDays = qs.validityDays || 30;
  const validUntil = new Date(new Date(q.createdAt).getTime() + validDays * 86400000).toLocaleDateString();
  const mailSubject = (settings.email.quoteSubject || "Quotation {{number}} from {{company}}").replace("{{number}}", q.number).replace("{{company}}", c.name || "Fenestra");
  const mailto = `mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(`Quote ${q.number}\nCustomer: ${q.customerName || "—"}\nTotal: ${peso(q.total)}\nValid until: ${validUntil}\n\n${c.name || ""}\n${c.phone || ""} ${c.email || ""}`)}`;

  return (
    <main className="page" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="bar" style={{ marginBottom: 14 }}>
        <Link href="/quotes" className="btn" style={{ textDecoration: "none" }}>← Quotes</Link>
        <button className="btn primary" onClick={() => window.print()}>Print / Save PDF</button>
        <a className="btn" href={mailto} style={{ textDecoration: "none" }}>Email</a>
      </div>

      <section className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", borderBottom: "1px solid var(--line)", paddingBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              {ds.showLogoOnDocs && c.logoUrl ? <img src={c.logoUrl} alt={c.name} style={{ height: 40, objectFit: "contain" }} /> : null}
              <div>
                <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700 }}>{c.name || "Fenestra"}</div>
                <div style={{ fontSize: 12, color: "var(--dim)" }}>Window & Door Quotation</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--dim)" }}>{c.address}{c.phone ? ` · ${c.phone}` : ""}{c.email ? ` · ${c.email}` : ""}</div>
            {c.website && <div style={{ fontSize: 12, color: "var(--dim)" }}>{c.website}</div>}
            <h2 style={{ margin: "10px 0 4px", fontSize: 26, textTransform: "none", letterSpacing: 0 }}>{q.number}</h2>
            <div style={{ color: "var(--dim)", fontSize: 12 }}>Date: {new Date(q.createdAt).toLocaleString()} · Status: <b style={{ textTransform: "capitalize" }}>{q.status}</b></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--dim)", textTransform: "uppercase", letterSpacing: ".08em" }}>Prepared for</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{q.customerName || "—"}</div>
            <div style={{ color: "var(--dim)", fontSize: 12, marginTop: 6 }}>Valid until {validUntil} · Currency {settings.pricing.currency}</div>
          </div>
        </div>

        <h3 style={{ margin: "14px 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--dim)" }}>Line items</h3>
        <div className="table-wrap"><table>
          <thead><tr><th>#</th><th>Description</th><th className="num">Size (mm)</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Total</th></tr></thead>
          <tbody>
            {q.lines.map((l, i) => {
              let mat = ""; try { mat = MATERIAL_LABELS[getSeries(l.design.seriesId).material]; } catch { mat = ""; }
              return (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{l.description}</div>
                    <div style={{ color: "var(--dim)", fontSize: 12 }}>
                      {mat ? `${mat} · ` : ""}{OPERATION_LABELS[l.design.operation]} · {l.design.glass} · {l.design.colourExt}/{l.design.colourInt}
                      {l.design.layout ? ` · ${l.design.layout.cols}×${l.design.layout.rows}` : ""}{l.design.shape && l.design.shape !== "rect" ? ` · ${l.design.shape}` : ""}
                      {qs.showGlass && l.design.grille && l.design.grille !== "None" ? ` · ${l.design.grille}` : ""}
                      {l.design.rush ? " · rush" : ""}{l.design.screen ? " · screen" : ""}
                    </div>
                    {l.design.specifics && <div style={{ color: "var(--dim)", fontSize: 12, marginTop: 2 }}>Specifics: {l.design.specifics}</div>}
                  </td>
                  <td className="num">{num(l.design.width)}×{num(l.design.height)}</td>
                  <td className="num">{l.quantity}</td>
                  <td className="num">{peso(l.unitPrice)}</td>
                  <td className="num">{peso(l.lineTotal)}</td>
                </tr>
              );
            })}
            <tr className="sub"><td colSpan={5}>Net</td><td className="num">{peso(q.net)}</td></tr>
            <tr><td colSpan={5}>Discount {q.discount}%</td><td className="num">−{peso(Math.max(0, q.net - q.net * (1 - q.discount / 100)))}</td></tr>
            <tr><td colSpan={5}>{settings.invoice.taxLabel} {q.vatRate}%</td><td className="num">{peso(q.vat)}</td></tr>
          </tbody>
        </table></div>
        <div className="total"><span>Grand total</span><b>{peso(q.total)}</b></div>
        {(q.notes || qs.defaultNotes) && <p style={{ marginTop: 12, color: "var(--dim)" }}><b>Notes:</b> {q.notes || qs.defaultNotes}</p>}

        {qs.showSignature && (
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div><div style={{ borderTop: "1px solid var(--line)", marginTop: 30, paddingTop: 6, fontSize: 12, color: "var(--dim)" }}>Prepared by / Date</div></div>
            <div><div style={{ borderTop: "1px solid var(--line)", marginTop: 30, paddingTop: 6, fontSize: 12, color: "var(--dim)" }}>Customer acceptance / Date</div></div>
          </div>
        )}

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: 11, color: "var(--dim)" }}>
          <b>Terms:</b> {qs.terms || "—"}
          <br />{ds.footerLegal}{c.license ? ` · ${c.license}` : ""}
        </div>
      </section>
    </main>
  );
}
