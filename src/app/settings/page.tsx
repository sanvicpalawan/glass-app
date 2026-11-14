"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { SERIES, COLOURS, RATES, OPTION_CATALOG } from "@/domain";
import type { AppSettings } from "@/lib/settings";

type Tab = "company" | "quote" | "invoice" | "pricing" | "documents" | "email" | "production" | "catalogue" | "data";

export default function SettingsPage() {
  const { settings, saveSettings, refresh } = useStore();
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [tab, setTab] = useState<Tab>("company");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const logoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { setDraft(settings); }, [settings]);

  function setPath(path: string, value: any) {
    setDraft((prev) => {
      const parts = path.split(".");
      const r: any = { ...prev };
      let o: any = r;
      for (let i = 0; i < parts.length - 1; i++) { o[parts[i]] = { ...o[parts[i]] }; o = o[parts[i]]; }
      o[parts[parts.length - 1]] = value;
      return r as AppSettings;
    });
  }

  async function save() {
    setSaving(true); setMsg("");
    try { await saveSettings(draft); setMsg("Settings saved."); }
    catch (e: any) { setMsg(`Save failed: ${e?.message || e}`); }
    finally { setSaving(false); }
  }

  function onLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => setPath("company.logoUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function exportData() {
    try {
      const res = await fetch("/api/store");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load store");
      const data = { exportedAt: new Date().toISOString(), store: { customers: json.customers||[], quotes: json.quotes||[], predefined: json.predefined||[], sites: json.sites||[], openings: json.openings||[], orders: json.orders||[], invoices: json.invoices||[], inventory: json.inventory||[], purchases: json.purchases||[], settings: json.settings||draft }, catalogue: { series: SERIES, colours: COLOURS, rates: RATES, optionCatalog: OPTION_CATALOG } };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `fenestra-backup-${Date.now()}.json`; a.click(); URL.revokeObjectURL(a.href);
      setMsg("Exported backup (including settings).");
    } catch (e: any) { setMsg(`Export failed: ${e?.message || e}`); }
  }

  async function importData(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        const store = data.store || {};
        if (store.settings) await saveSettings(store.settings);
        for (const c of (store.customers||[])) await fetch("/api/store/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) });
        for (const p of (store.predefined||[])) await fetch("/api/store/predefined", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
        for (const q of (store.quotes||[])) await fetch("/api/store/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) });
        for (const col of ["sites","openings","orders","invoices","inventory","purchases"]) for (const it of (store[col]||[])) await fetch(`/api/store/${col}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(it) });
        await refresh();
        setMsg("Imported. Settings and data restored.");
      } catch (e: any) { setMsg(`Import failed: ${e?.message || e}`); }
    };
    reader.readAsText(file);
  }

  const getVal = (path: string) => { const parts = path.split("."); let v: any = draft as any; for (const p of parts) v = v?.[p]; return v; };
  const TabBtn = ({ id, label }: { id: Tab; label: string }) => (
    <button className={tab===id?"btn primary":"btn"} onClick={()=>setTab(id)}>{label}</button>
  );
  const f = (label: string, path: string, type: string = "text", placeholder: string = "") => {
    const v = getVal(path); const isNum = type === "number";
    return (
      <label className="field" key={path}><span>{label}</span>
        <input
          type={isNum ? "text" : type}
          inputMode={isNum ? "decimal" : undefined}
          value={v ?? ""}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value;
            if (!isNum) return setPath(path, raw);
            if (raw === "" || raw === "-" || raw === "." || raw === "-.") return setPath(path, raw);
            const n = Number(raw);
            setPath(path, Number.isFinite(n) ? n : raw);
          }}
        />
      </label>
    );
  };
  const ta = (label: string, path: string, rows = 3) => (
    <label className="field" key={path}><span>{label}</span>
      <textarea rows={rows} value={getVal(path) ?? ""} onChange={(e)=>setPath(path, e.target.value)} style={{width:"100%",background:"var(--panel2)",color:"var(--txt)",border:"1px solid var(--line)",borderRadius:7,padding:"8px 10px",font:"inherit"}} />
    </label>
  );
  const ck = (label: string, path: string) => (
    <label className="field" key={path}><span>{label} <input type="checkbox" checked={!!getVal(path)} onChange={(e)=>setPath(path, e.target.checked)} /></span></label>
  );

  return (
    <main className="page" style={{ display: "grid", gap: 18, maxWidth: 1100 }}>
      <div className="bar" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Settings</h2>
        <div className="bar">
          <button className="btn primary" onClick={()=>void save()} disabled={saving}>{saving?"Saving…":"Save settings"}</button>
          {msg && <span className={msg.includes("failed")||msg.includes("Failed")?"warn":"ok"}>{msg}</span>}
        </div>
      </div>

      <div className="bar" style={{ flexWrap: "wrap" }}>
        <TabBtn id="company" label="Company & Branding" />
        <TabBtn id="quote" label="Quotes" />
        <TabBtn id="invoice" label="Invoice & Payment" />
        <TabBtn id="pricing" label="Pricing & Units" />
        <TabBtn id="documents" label="Documents" />
        <TabBtn id="email" label="Email (SMTP)" />
        <TabBtn id="production" label="Production" />
        <TabBtn id="catalogue" label="Catalogue defaults" />
        <TabBtn id="data" label="Data & Backup" />
      </div>

      {tab === "company" && (
        <section className="card">
          <h3>Company & branding</h3>
          <div className="grid-2">
            <div>
              {f("Company name", "company.name")}
              {f("Phone", "company.phone")}
              {f("Email", "company.email")}
              {f("Website", "company.website")}
              {f("License / Registration", "company.license")}
            </div>
            <div>
              {ta("Address", "company.address", 3)}
              <label className="field"><span>Logo</span>
                <div className="bar">
                  {draft.company.logoUrl ? <img src={draft.company.logoUrl} alt="Logo" style={{height:48,objectFit:"contain",background:"var(--panel2)",border:"1px solid var(--line)",borderRadius:6,padding:4}} /> : <span style={{color:"var(--dim)"}}>No logo</span>}
                  <button className="btn" onClick={()=>logoRef.current?.click()}>Upload logo</button>
                  {draft.company.logoUrl && <button className="btn" onClick={()=>setPath("company.logoUrl","")}>Remove</button>}
                  <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={(e)=>{const f=e.target.files?.[0]; if(f) onLogo(f);}} />
                </div>
              </label>
              {ta("Footer text (docs/site)", "company.footerText", 2)}
            </div>
          </div>
        </section>
      )}

      {tab === "quote" && (
        <section className="card">
          <h3>Quote settings</h3>
          <div className="grid-2">
            <div>
              {f("Quote prefix", "quote.prefix")}
              {f("Next quote number", "quote.nextNumber", "number")}
              {f("Validity (days)", "quote.validityDays", "number")}
              {ta("Default notes", "quote.defaultNotes", 3)}
            </div>
            <div>
              {ta("Terms & conditions", "quote.terms", 6)}
              <div className="row">
                {ck("Show rough opening", "quote.showRo")}
                {ck("Show glass details", "quote.showGlass")}
              </div>
              <div className="row">
                {ck("Show hardware", "quote.showHardware")}
                {ck("Show signature block", "quote.showSignature")}
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "invoice" && (
        <section className="card">
          <h3>Invoice & payment</h3>
          <div className="grid-2">
            <div>
              {f("Invoice prefix", "invoice.prefix")}
              {f("Next invoice number", "invoice.nextNumber", "number")}
              {f("Due days", "invoice.dueDays", "number")}
              {f("Deposit %", "invoice.depositPercent", "number")}
              {f("Tax label", "invoice.taxLabel", "text", "VAT")}
              {f("Tax rate %", "invoice.taxRate", "number")}
            </div>
            <div>
              {ta("Payment terms", "invoice.paymentTerms", 3)}
              {ta("Bank / payment details", "invoice.bankDetails", 4)}
              {ta("Late fee text", "invoice.lateFeeText", 2)}
            </div>
          </div>
        </section>
      )}

      {tab === "pricing" && (
        <section className="card">
          <h3>Pricing & units</h3>
          <div className="grid-2">
            <div>
              {f("Currency code", "pricing.currency", "text", "PHP")}
              {f("Currency symbol", "pricing.currencySymbol", "text", "₱")}
              {f("Default margin %", "pricing.defaultMargin", "number")}
              {f("Default discount %", "pricing.defaultDiscount", "number")}
            </div>
            <div>
              <label className="field"><span>Units</span>
                <select value={draft.pricing.units} onChange={(e)=>setPath("pricing.units", e.target.value)}>
                  <option value="mm">Metric (mm)</option><option value="inch">Imperial (inch)</option>
                </select>
              </label>
              {f("Rounding (0 = none, e.g. 10)", "pricing.rounding", "number")}
              <p style={{color:"var(--dim)",fontSize:12}}>Currency symbol/rates display are applied where supported; catalogue rates remain in your configured base currency.</p>
            </div>
          </div>
        </section>
      )}

      {tab === "documents" && (
        <section className="card">
          <h3>Documents & print</h3>
          <div className="grid-2">
            <div>
              {ck("Show logo on quotes/invoices", "documents.showLogoOnDocs")}
              <label className="field"><span>Header style</span>
                <select value={draft.documents.headerStyle} onChange={(e)=>setPath("documents.headerStyle", e.target.value)}>
                  <option value="standard">Standard</option><option value="compact">Compact</option>
                </select>
              </label>
              {f("Accent color", "documents.accentColor", "text", "#e8a33d")}
            </div>
            <div>
              {ta("Footer / legal text", "documents.footerLegal", 4)}
            </div>
          </div>
        </section>
      )}

      {tab === "email" && (
        <section className="card">
          <h3>Email (SMTP)</h3>
          <p style={{color:"var(--dim)",fontSize:12,marginTop:0}}>Used for real sending from the app (quotes/invoices). Leave blank to use mailto fallback. Password is stored in your database — protect access.</p>
          <div className="grid-2">
            <div>
              {f("From name", "email.fromName")}
              {f("From email", "email.fromEmail")}
              {f("SMTP host", "email.smtpHost", "text", "smtp.example.com")}
              {f("SMTP port", "email.smtpPort", "number")}
            </div>
            <div>
              {f("SMTP user", "email.smtpUser")}
              <label className="field"><span>SMTP password / app password</span>
                <input type="password" value={draft.email.smtpPass} onChange={(e)=>setPath("email.smtpPass", e.target.value)} />
              </label>
              {ck("Use secure (TLS/465)", "email.smtpSecure")}
              {f("Quote email subject", "email.quoteSubject")}
              {f("Invoice email subject", "email.invoiceSubject")}
            </div>
          </div>
        </section>
      )}

      {tab === "production" && (
        <section className="card">
          <h3>Production defaults</h3>
          <div className="grid-2">
            <div>
              {f("Stock bar length (mm)", "production.stockBarLength", "number")}
              {f("Saw kerf (mm)", "production.kerf", "number")}
            </div>
            <div>
              {ck("Show barcode on labels", "production.labelShowBarcode")}
              {ck("Show glass on labels", "production.labelShowGlass")}
            </div>
          </div>
        </section>
      )}

      {tab === "catalogue" && (
        <section className="card">
          <h3>Catalogue & job defaults</h3>
          <div className="grid-2">
            <div>
              <label className="field"><span>Default material</span>
                <select value={draft.catalogue.defaultMaterial} onChange={(e)=>setPath("catalogue.defaultMaterial", e.target.value)}>
                  <option value="aluminum">Aluminum</option><option value="pvc">PVC/uPVC</option><option value="wood">Wood</option><option value="fiberglass">Fiberglass</option><option value="composite">Composite</option>
                </select>
              </label>
              <label className="field"><span>Default series</span>
                <select value={draft.catalogue.defaultSeriesId} onChange={(e)=>setPath("catalogue.defaultSeriesId", e.target.value)}>
                  {SERIES.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Default glass</span>
                <select value={draft.catalogue.defaultGlass} onChange={(e)=>setPath("catalogue.defaultGlass", e.target.value)}>
                  <option value="clear">Clear</option><option value="lam">Laminated</option><option value="temp">Tempered</option><option value="dgu">Double glazed</option><option value="tinted">Tinted</option><option value="lowe">Low-E</option>
                </select>
              </label>
            </div>
            <div>
              <label className="field"><span>Default hardware</span>
                <select value={draft.catalogue.defaultHardware} onChange={(e)=>setPath("catalogue.defaultHardware", e.target.value)}>
                  <option value="none">None</option><option value="std">Standard</option><option value="prem">Premium</option><option value="heavy">Heavy duty</option>
                </select>
              </label>
              {f("Default lead time (days)", "catalogue.leadTimeDays", "number")}
              <p style={{color:"var(--dim)",fontSize:12}}>Supplier rates/series are managed in the catalogue and domain data. Use Data & Backup to export/import; replace demo rates with your supplier price list.</p>
            </div>
          </div>
        </section>
      )}

      {tab === "data" && (
        <section className="card">
          <h3>Data & backup</h3>
          <p style={{ color: "var(--dim)", fontSize: 12, marginTop: 0 }}>Export/import all app data and settings (customers, quotes, sites, openings, orders, invoices, inventory, purchases, settings). Saved in Neon Postgres.</p>
          <div className="bar">
            <button className="btn primary" onClick={() => void exportData()}>Export backup (JSON)</button>
            <button className="btn" onClick={() => fileRef.current?.click()}>Import backup</button>
            <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void importData(f); }} />
          </div>
          <p style={{ color: "var(--dim)", fontSize: 12, marginTop: 14 }}>Load real supplier profiles/prices/rules by updating <code>src/domain/catalogue.ts</code> (and rates/options) with your PVC/aluminum supplier datasheet.</p>
        </section>
      )}
    </main>
  );
}
