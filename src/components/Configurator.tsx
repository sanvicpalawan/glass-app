"use client";

import { useEffect, useMemo, useState } from "react";

import { Drawing } from "./Drawing";
import { useStore } from "@/lib/store";
import { defaultSettings } from "@/lib/settings";
import {
  COLOURS,
  GLASS_LABELS,
  GRILLE_OPTIONS,
  HARDWARE_LABELS,
  ITEM_TYPES,
  MATERIAL_LABELS,
  OPERATION_LABELS,
  RATES,
  SERIES,
  SILL_OPTIONS,
  buildGeometry,
  buildQuote,
  checkDesign,
  defaultLayoutFor,
  defaultSelections,
  dxfFilename,
  getColour,
  materials,
  num,
  optionsForSeries,
  peso,
  priceDesign,
  roughOpening,
  seriesForMaterial,
  snapshotLine,
  toDxf,
} from "@/domain";
import type {
  Design,
  GlassKind,
  HardwareKind,
  ItemType,
  Material,
  MeasureType,
  Operation,
  QuoteLineSnapshot,
} from "@/domain";

function baseDesign(settings = defaultSettings): { design: Design; material: Material } {
  const cat = settings.catalogue;
  const series = SERIES.find((s) => s.id === cat.defaultSeriesId) || SERIES.find((s) => s.material === (cat.defaultMaterial as Material)) || SERIES[0];
  const material = (series?.material || "aluminum") as Material;
  const op = series.operations[0] || "sliding2";
  const design: Design = {
    operation: op,
    seriesId: series.id,
    itemType: "custom",
    width: 1800,
    height: 1500,
    quantity: 1,
    measureType: "std",
    colourExt: "WH",
    colourInt: "WH",
    glass: (cat.defaultGlass as any) || "lam",
    hardware: (cat.defaultHardware as any) || "std",
    screen: false,
    rush: false,
    margin: settings.pricing.defaultMargin ?? 35,
    description: "",
    reference: "",
    specifics: "",
    layout: defaultLayoutFor(op),
    shape: "rect",
    grille: "None",
    sill: "Standard",
    options: defaultSelections(series),
  };
  return { design, material };
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function Configurator() {
  const store = useStore();
  const settings = store.settings || defaultSettings;
  const initial = useMemo(() => baseDesign(settings), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [design, setDesign] = useState<Design>(initial.design);
  const [material, setMaterial] = useState<Material>(initial.material);
  const [lines, setLines] = useState<QuoteLineSnapshot[]>([]);
  const [discount, setDiscount] = useState(settings.pricing.defaultDiscount || 0);
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [tab, setTab] = useState<"options" | "dimensions" | "bom" | "notes" | "shapes">("options");
  const [presetName, setPresetName] = useState("");
  const [presetId, setPresetId] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (store.loading || initialized) return;
    const b = baseDesign(store.settings);
    setDesign(b.design);
    setMaterial(b.material);
    setDiscount(store.settings.pricing.defaultDiscount || 0);
    setInitialized(true);
  }, [store.loading, store.settings, initialized]);

  const filteredSeries = useMemo(() => seriesForMaterial(material), [material]);
  const currentSeries = useMemo(() => SERIES.find((s) => s.id === design.seriesId) || filteredSeries[0] || SERIES[0], [design.seriesId, filteredSeries]);
  const ops = currentSeries.operations;

  const geometry = useMemo(() => buildGeometry({ ...design, seriesId: currentSeries.id }), [design, currentSeries]);
  const ro = useMemo(() => roughOpening({ ...design, seriesId: currentSeries.id }, geometry.series), [design, currentSeries, geometry]);
  const price = useMemo(() => priceDesign({ ...design, seriesId: currentSeries.id }, geometry), [design, currentSeries, geometry]);
  const warnings = useMemo(() => checkDesign({ ...design, seriesId: currentSeries.id }, geometry), [design, currentSeries, geometry]);

  const ext = getColour(design.colourExt);
  const intC = getColour(design.colourInt);
  const twoTone = design.colourExt !== design.colourInt;

  const vatRate = settings.invoice.taxRate ?? 12;
  const quote = useMemo(
    () => buildQuote(lines.map((l) => l.design), { vatRate, discountPercent: discount }),
    [lines, discount, vatRate],
  );

  function set<K extends keyof Design>(key: K, value: Design[K]) { setDesign((d) => ({ ...d, [key]: value })); }

  function applyOperation(op: Operation) {
    setDesign((d) => ({ ...d, operation: op, layout: defaultLayoutFor(op) }));
  }
  function onMaterial(m: Material) {
    setMaterial(m);
    const list = seriesForMaterial(m);
    if (list.length) {
      const s = list[0];
      const op = s.operations.includes(design.operation) ? design.operation : s.operations[0];
      setDesign((d) => ({ ...d, seriesId: s.id, operation: op, layout: defaultLayoutFor(op), options: { ...defaultSelections(s), ...(d.options || {}) } }));
    }
  }
  function onSeries(id: string) {
    const s = SERIES.find((x) => x.id === id);
    if (!s) return;
    setMaterial(s.material);
    const op = s.operations.includes(design.operation) ? design.operation : s.operations[0];
    setDesign((d) => ({ ...d, seriesId: id, operation: op, layout: defaultLayoutFor(op), options: { ...defaultSelections(s), ...(d.options || {}) } }));
  }
  function loadPredefined(id: string) {
    const p = store.predefined.find((x) => x.id === id);
    if (!p) return;
    const s = SERIES.find((x) => x.id === p.design.seriesId);
    if (s) setMaterial(s.material);
    setDesign({ ...p.design });
    setPresetId(id);
  }
  async function savePredefined() {
    const name = presetName.trim() || design.description?.trim() || `Design ${store.predefined.length + 1}`;
    try {
      await store.savePredefined(name, { ...design, seriesId: currentSeries.id });
      setPresetName("");
      setSavedMsg(`Saved predefined: ${name}`);
    } catch (e: any) {
      setSavedMsg(`Save failed: ${e?.message || e}`);
    }
  }

  function addToQuote() { setLines((prev) => [...prev, snapshotLine({ ...design, seriesId: currentSeries.id })]); setSavedMsg(""); }
  function removeLine(i: number) { setLines((prev) => prev.filter((_, idx) => idx !== i)); }
  function exportDxf() { download(dxfFilename({ ...design, seriesId: currentSeries.id }), toDxf({ ...design, seriesId: currentSeries.id }, geometry, ro)); }

  async function saveQuote() {
    if (!lines.length) return;
    const customer = store.customers.find((c) => c.id === customerId);
    try {
      const saved = await store.saveQuote({
        customerId: customer?.id, customerName: customer?.name, status: "draft", vatRate, discount,
        lines: lines.map((l) => ({
          design: l.design,
          description: l.design.description || `${OPERATION_LABELS[l.design.operation]} · ${l.design.width}×${l.design.height} mm · ${l.geometry.series.name} · ${(l.design.layout?.cols ?? 1)}x${(l.design.layout?.rows ?? 1)}${l.design.grille && l.design.grille !== "None" ? ` · ${l.design.grille}` : ""}`,
          unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.lineTotal,
        })),
        net: quote.net, vat: quote.vat, total: quote.total, notes,
      });
      setSavedMsg(`Saved ${saved.number}`); setLines([]); setNotes("");
    } catch (e: any) {
      setSavedMsg(`Save failed: ${e?.message || e}`);
    }
  }

  const stockBarLength = settings.production.stockBarLength || RATES.stockBarLength;
  const bars = geometry.members.map((m) => ({ ...m, bars: Math.ceil((m.length * m.quantity) / stockBarLength) }));
  const totalBars = bars.reduce((s, m) => s + m.bars, 0);

  return (
    <main className="app-main">
      <section className="card">
        <h2>Design studio</h2>

        <h3 style={{ marginTop: 0 }}>Material & series</h3>
        <label className="field"><span>Material</span>
          <select value={material} onChange={(e) => onMaterial(e.target.value as Material)}>
            {materials().map((m) => (<option key={m} value={m}>{MATERIAL_LABELS[m]}</option>))}
          </select>
        </label>
        <label className="field"><span>Series (profile system)</span>
          <select value={currentSeries.id} onChange={(e) => onSeries(e.target.value)}>
            {filteredSeries.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </label>
        <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 10 }}>{currentSeries.family} · {MATERIAL_LABELS[currentSeries.material]} · face {currentSeries.face}mm · max panel {num(currentSeries.maxPanelWidth)}mm</div>

        <label className="field"><span>Operation / design</span>
          <select value={ops.includes(design.operation) ? design.operation : ops[0]} onChange={(e) => applyOperation(e.target.value as Operation)}>
            {ops.map((op) => (<option key={op} value={op}>{OPERATION_LABELS[op]}</option>))}
          </select>
        </label>

        <div className="row">
          <label className="field"><span>Width DLO (mm)</span><input type="number" value={design.width} min={300} max={6000} step={10} onChange={(e) => set("width", Number(e.target.value) || 300)} /></label>
          <label className="field"><span>Height DLO (mm)</span><input type="number" value={design.height} min={300} max={3000} step={10} onChange={(e) => set("height", Number(e.target.value) || 300)} /></label>
        </div>
        <label className="field"><span>Measure type (rough opening)</span>
          <select value={design.measureType} onChange={(e) => set("measureType", e.target.value as MeasureType)}>
            <option value="std">Std RO (+13 × +13 mm)</option>
            <option value="masonry">Masonry — top of riser / bottom of head</option>
            <option value="none">DLO only</option>
          </select>
        </label>

        <h3>Shapes / grid (design studio)</h3>
        <div className="row">
          <label className="field"><span>Opening shape</span>
            <select value={design.shape || "rect"} onChange={(e) => set("shape", e.target.value as any)}>
              <option value="rect">Rectangle</option>
              <option value="arch">Arch top</option>
              <option value="round_top">Round top</option>
              <option value="raked_left">Raked left</option>
              <option value="raked_right">Raked right</option>
              <option value="triangle">Triangle / gable</option>
            </select>
          </label>
          <label className="field"><span>Arch/rise (mm)</span><input type="number" min={0} max={2000} step={10} value={design.archRise ?? Math.round(design.height * 0.2)} onChange={(e) => set("archRise", Number(e.target.value) || 0)} /></label>
        </div>
        <div className="row">
          <label className="field"><span>Lites wide (cols)</span><input type="number" min={1} max={8} value={design.layout?.cols ?? 1} onChange={(e) => set("layout", { ...(design.layout||{cols:1,rows:1}), cols: Math.max(1, Number(e.target.value) || 1) })} /></label>
          <label className="field"><span>Lites high (rows)</span><input type="number" min={1} max={6} value={design.layout?.rows ?? 1} onChange={(e) => set("layout", { ...(design.layout||{cols:1,rows:1}), rows: Math.max(1, Number(e.target.value) || 1) })} /></label>
        </div>
        <div className="row">
          <label className="field"><span>Grille pattern</span>
            <select value={design.grille || "None"} onChange={(e) => set("grille", e.target.value)}>{GRILLE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}</select>
          </label>
          <label className="field"><span>Sill type</span>
            <select value={design.sill || "Standard"} onChange={(e) => set("sill", e.target.value)}>{SILL_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </label>
        </div>
        <label className="field"><span>Predefined design</span>
          <div className="bar">
            <select value={presetId} onChange={(e) => { setPresetId(e.target.value); if (e.target.value) loadPredefined(e.target.value); }} style={{ flex: 1 }}>
              <option value="">— select saved design —</option>
              {store.predefined.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </label>
        <div className="bar" style={{ marginBottom: 8 }}>
          <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Save as predefined name..." style={{ flex: 1 }} />
          <button className="btn" onClick={() => void savePredefined()}>Save</button>
        </div>

        <h3>Item & client specifics</h3>
        <div className="row">
          <label className="field"><span>Quantity</span><input type="number" value={design.quantity} min={1} max={200} onChange={(e) => set("quantity", Math.max(1, Number(e.target.value) || 1))} /></label>
          <label className="field"><span>Item type</span>
            <select value={design.itemType} onChange={(e) => set("itemType", e.target.value as ItemType)}>
              {(Object.keys(ITEM_TYPES) as ItemType[]).map((k) => (<option key={k} value={k}>{ITEM_TYPES[k].label}</option>))}
            </select>
          </label>
        </div>
        <label className="field"><span>Reference (e.g. W-01 Living room)</span><input value={design.reference || ""} onChange={(e) => set("reference", e.target.value)} placeholder="W-01" /></label>
        <label className="field"><span>Description / custom item</span><input value={design.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Custom — Sealed Units, special shape..." /></label>
        <label className="field"><span>Client specifics / notes</span><input value={design.specifics || ""} onChange={(e) => set("specifics", e.target.value)} placeholder="Handle side, low sill, tinted, site notes..." /></label>

        <h3>Finish (exterior / interior)</h3>
        <div className="row">
          <label className="field"><span>Exterior</span>
            <select value={design.colourExt} onChange={(e) => set("colourExt", e.target.value)}>{COLOURS.answers.map((a) => (<option key={a.code} value={a.code}>{a.label}</option>))}</select>
          </label>
          <label className="field"><span>Interior</span>
            <select value={design.colourInt} onChange={(e) => set("colourInt", e.target.value)}>{COLOURS.answers.map((a) => (<option key={a.code} value={a.code}>{a.label}</option>))}</select>
          </label>
        </div>
        <div className="bar" style={{ marginBottom: 10 }}>
          <span className="chip"><i style={{ background: `rgb(${ext.rgb.join(",")})` }} /> ext: {ext.label}</span>
          <span className="chip"><i style={{ background: `rgb(${intC.rgb.join(",")})` }} /> int: {intC.label}</span>
          {twoTone && <span className="chip">dual colour</span>}
        </div>

        <h3>Glazing & hardware</h3>
        <label className="field"><span>Glass</span>
          <select value={design.glass} onChange={(e) => set("glass", e.target.value as GlassKind)}>
            {(Object.keys(GLASS_LABELS) as GlassKind[]).map((g) => (<option key={g} value={g}>{GLASS_LABELS[g]}</option>))}
          </select>
        </label>
        <div className="row">
          <label className="field"><span>Hardware</span>
            <select value={design.hardware} onChange={(e) => set("hardware", e.target.value as HardwareKind)}>
              {(Object.keys(HARDWARE_LABELS) as HardwareKind[]).map((k) => (<option key={k} value={k}>{HARDWARE_LABELS[k]}</option>))}
            </select>
          </label>
          <label className="field"><span>Rush</span>
            <select value={design.rush ? "yes" : "no"} onChange={(e) => set("rush", e.target.value === "yes")}><option value="no">No</option><option value="yes">Yes</option></select>
          </label>
        </div>
        <label className="field"><span>Insect screen <input type="checkbox" checked={design.screen} onChange={(e) => set("screen", e.target.checked)} /></span></label>

        <h3>Options & extras (price-adjusted)</h3>
        {optionsForSeries(currentSeries).map((cat) => (
          <label className="field" key={cat.id}><span>{cat.label}</span>
            <select value={(design.options || {})[cat.id] || cat.defaultCode || cat.answers[0]?.code} onChange={(e) => set("options", { ...(design.options || {}), [cat.id]: e.target.value })}>
              {cat.answers.map((a) => (<option key={a.code} value={a.code}>{a.label}{a.adjustFlat ? ` (+₱${a.adjustFlat})` : a.adjustPct ? ` (+${Math.round(a.adjustPct*100)}%)` : ""}</option>))}
            </select>
          </label>
        ))}

        <label className="field"><span>Margin — <b>{design.margin}%</b></span>
          <input type="range" min={10} max={60} step={1} value={design.margin} onChange={(e) => set("margin", Number(e.target.value))} />
        </label>
      </section>

      <section className="stage">
        <Drawing
          design={{ ...design, seriesId: currentSeries.id }}
          geometry={geometry}
          roughOpening={ro}
          extColour={ext.rgb.join(",")}
          intColour={intC.rgb.join(",")}
          editable={tab === "shapes"}
          onLayoutChange={(layout) => set("layout", layout)}
        />

        <div className="bar">
          <span className="meta" style={{ flex: 1 }}>
            <span>DLO <b>{num(design.width)} × {num(design.height)} mm</b></span>
            <span>RO <b>{ro.adjusted ? `${num(ro.width)} × ${num(ro.height)} mm` : "—"}</b></span>
            <span>Area <b>{price.area.toFixed(2)} m²</b></span>
            <span>Panels <b>{geometry.panels}</b></span>
            <span>Bars <b>{totalBars}</b></span>
          </span>
          <button className="btn" onClick={exportDxf}>Download DXF</button>
          <button className="btn primary" onClick={addToQuote}>Add to quote</button>
        </div>

        <div className="warn">
          {warnings.length === 0 ? <span className="ok">No sizing issues detected.</span> : <ul>{warnings.map((w) => <li key={w.code}>{w.message}</li>)}</ul>}
        </div>

        <div className="bar" style={{ marginTop: 4 }}>
          {(["shapes", "options", "dimensions", "bom", "notes"] as const).map((t) => (
            <button key={t} className={`btn ${tab === t ? "primary" : ""}`} onClick={() => setTab(t)}>
              {t === "shapes" ? "Shapes / Grid" : t === "options" ? "Cost / Price" : t === "dimensions" ? "Dimensions" : t === "bom" ? "BOM & Glass" : "Notes / Specifics"}
            </button>
          ))}
        </div>

        {tab === "shapes" && (
          <div className="cols">
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--dim)" }}>Grid / shape</h2>
              <table><tbody>
                <tr><td>Lites wide × high</td><td className="num"><b>{design.layout?.cols ?? 1} × {design.layout?.rows ?? 1}</b></td></tr>
                <tr><td>Total lites</td><td className="num">{(design.layout?.cols ?? 1) * (design.layout?.rows ?? 1)}</td></tr>
                <tr><td>Grille</td><td>{design.grille || "None"}</td></tr>
                <tr><td>Sill</td><td>{design.sill || "Standard"}</td></tr>
                <tr><td>Operation</td><td>{OPERATION_LABELS[ops.includes(design.operation) ? design.operation : ops[0]]}</td></tr>
              </tbody></table>
              <p style={{ color: "var(--dim)", fontSize: 12 }}>Change cols/rows in the left panel to add mullions and transoms (shapes/grid). Predefined designs can be saved and reloaded.</p>
            </div>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--dim)" }}>Predefined designs ({store.predefined.length})</h2>
              {store.predefined.length === 0 ? <p style={{ color: "var(--dim)", fontSize: 12 }}>No saved designs yet. Name and save one from the left panel.</p> : (
                <table><tbody>{store.predefined.slice(0, 8).map((p) => (
                  <tr key={p.id}><td>{p.name}</td><td><button className="btn" onClick={() => loadPredefined(p.id)}>Load</button></td></tr>
                ))}</tbody></table>
              )}
            </div>
          </div>
        )}

        {tab === "options" && (
          <div className="cols">
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--dim)" }}>Cost &amp; price</h2>
              <table><tbody>
                {price.lines.map((l) => (<tr key={l.label}><td>{l.label}</td><td className="num">{peso(l.amount)}</td></tr>))}
                <tr className="sub"><td>Subtotal</td><td className="num">{peso(price.subtotal)}</td></tr>
                <tr><td>Margin {design.margin}%</td><td className="num">{peso(price.margin)}</td></tr>
              </tbody></table>
              <div className="total"><span>Per unit <small style={{ color: "var(--dim)" }}>excl. VAT</small></span><b>{peso(price.perUnit)}</b></div>
              <div className="meta" style={{ marginTop: 6 }}><span>Per m² <b>{peso(price.perSquareMetre)}</b></span><span>Profile <b>{price.profileMetres.toFixed(1)} m</b></span></div>
            </div>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--dim)" }}>Summary</h2>
              <table><tbody>
                <tr><td>Material</td><td><b>{MATERIAL_LABELS[currentSeries.material]}</b></td></tr>
                <tr><td>Series</td><td>{currentSeries.name}</td></tr>
                <tr><td>Operation</td><td>{OPERATION_LABELS[ops.includes(design.operation) ? design.operation : ops[0]]}</td></tr>
                <tr><td>Item type</td><td>{ITEM_TYPES[design.itemType].label}</td></tr>
                <tr><td>Finish</td><td>{ext.label} / {intC.label}{twoTone ? " (dual)" : ""}</td></tr>
                <tr><td>Glass</td><td>{GLASS_LABELS[design.glass]}</td></tr>
                <tr><td>Hardware</td><td>{HARDWARE_LABELS[design.hardware]}</td></tr>
              </tbody></table>
            </div>
          </div>
        )}

        {tab === "dimensions" && (
          <div className="cols">
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--dim)" }}>Dimensions</h2>
              <table><tbody>
                <tr><td>DLO width</td><td className="num">{num(design.width)} mm</td></tr>
                <tr><td>DLO height</td><td className="num">{num(design.height)} mm</td></tr>
                <tr><td>RO width</td><td className="num">{num(ro.width)} mm</td></tr>
                <tr><td>RO height</td><td className="num">{num(ro.height)} mm</td></tr>
                <tr><td>Rule</td><td>{ro.rule.label}</td></tr>
                <tr><td>Unit area</td><td className="num">{(design.width * design.height / 1e6).toFixed(3)} m²</td></tr>
              </tbody></table>
            </div>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--dim)" }}>Profile system</h2>
              <table><tbody>
                <tr><td>Face</td><td className="num">{currentSeries.face} mm</td></tr>
                <tr><td>Rebate</td><td className="num">{currentSeries.rebate} mm</td></tr>
                <tr><td>Stile</td><td className="num">{currentSeries.stile} mm</td></tr>
                <tr><td>Max panel width</td><td className="num">{num(currentSeries.maxPanelWidth)} mm</td></tr>
                <tr><td>Max height</td><td className="num">{num(currentSeries.maxHeight)} mm</td></tr>
              </tbody></table>
            </div>
          </div>
        )}

        {tab === "bom" && (
          <div className="cols">
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--dim)" }}>Cut list / BOM</h2>
              <table>
                <thead><tr><th>Member</th><th className="num">Length</th><th className="num">Qty</th><th className="num">Bars</th></tr></thead>
                <tbody>{bars.map((m) => (<tr key={m.name}><td>{m.name}</td><td className="num">{num(m.length)}</td><td className="num">{m.quantity}</td><td className="num">{m.bars}</td></tr>))}</tbody>
              </table>
            </div>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--dim)" }}>Glass order</h2>
              <table>
                <thead><tr><th>Pane</th><th className="num">Size (mm)</th><th className="num">m²</th></tr></thead>
                <tbody>{geometry.panes.map((p, i) => (<tr key={i}><td>Pane {i + 1}</td><td className="num">{num(p.width)} × {num(p.height)}</td><td className="num">{p.area.toFixed(3)}</td></tr>))}</tbody>
              </table>
              <div className="meta" style={{ marginTop: 8 }}><span>Total glass <b>{(geometry.glassArea * design.quantity).toFixed(3)} m²</b></span></div>
            </div>
          </div>
        )}

        {tab === "notes" && (
          <div>
            <h2 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--dim)" }}>Client specifics & notes</h2>
            <table><tbody>
              <tr><td>Reference</td><td>{design.reference || "—"}</td></tr>
              <tr><td>Description</td><td>{design.description || "—"}</td></tr>
              <tr><td>Specifics</td><td>{design.specifics || "—"}</td></tr>
              <tr><td>Material</td><td>{MATERIAL_LABELS[currentSeries.material]}</td></tr>
              <tr><td>Series</td><td>{currentSeries.name}</td></tr>
            </tbody></table>
            <p style={{ color: "var(--dim)", fontSize: 12, marginBottom: 0 }}>Edit reference, description and specifics in the left panel. These are saved on the quote line — use for handle side, site notes, custom glass, special shapes, or any client request.</p>
          </div>
        )}
      </section>

      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>Quote builder — {lines.length} line{lines.length === 1 ? "" : "s"}</h2>
        {lines.length === 0 ? (
          <p style={{ color: "var(--dim)", margin: 0 }}>Configure a unit and press <b>Add to quote</b>. {savedMsg && <span className="ok"> {savedMsg}. See <a href="/quotes">Quotes</a>.</span>}</p>
        ) : (
          <>
            <table>
              <thead><tr><th>#</th><th>Description</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Line total</th><th /></tr></thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <div><b>{l.design.reference ? `${l.design.reference} — ` : ""}{l.design.description || OPERATION_LABELS[l.design.operation]}</b></div>
                      <div style={{ color: "var(--dim)", fontSize: 12 }}>
                        {MATERIAL_LABELS[l.geometry.series.material]} · {l.geometry.series.name} · {l.design.width}×{l.design.height} · {getColour(l.design.colourExt).label}/{getColour(l.design.colourInt).label}
                        {l.design.specifics ? ` · ${l.design.specifics}` : ""}
                      </div>
                    </td>
                    <td className="num">{l.quantity}</td>
                    <td className="num">{peso(l.unitPrice)}</td>
                    <td className="num">{peso(l.lineTotal)}</td>
                    <td><button className="btn" onClick={() => removeLine(i)}>Remove</button></td>
                  </tr>
                ))}
                <tr className="sub"><td colSpan={4}>Net</td><td className="num">{peso(quote.net)}</td><td /></tr>
                <tr><td colSpan={4}>Discount <input type="number" value={discount} min={0} max={50} onChange={(e) => setDiscount(Math.min(50, Math.max(0, Number(e.target.value) || 0)))} style={{ width: 70, marginLeft: 8, display: "inline-block", padding: "2px 6px" }} /> %</td><td className="num">−{peso(quote.discount)}</td><td /></tr>
                <tr><td colSpan={4}>{settings.invoice.taxLabel || "VAT"} {vatRate}%</td><td className="num">{peso(quote.vat)}</td><td /></tr>
              </tbody>
            </table>
            <div className="total"><span>Quote total</span><b>{peso(quote.total)}</b></div>
            <div className="grid-2" style={{ marginTop: 14, gap: 12, alignItems: "end" }}>
              <label className="field" style={{ margin: 0 }}><span>Customer</span>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">— no customer —</option>
                  {store.customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </label>
              <label className="field" style={{ margin: 0 }}><span>Quote notes</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery, terms, site..." /></label>
            </div>
            <div className="bar" style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={() => void saveQuote()}>Save quote</button>
              <button className="btn" onClick={() => setLines([])}>Clear</button>
              <button className="btn" onClick={() => window.print()}>Print / PDF</button>
              {savedMsg && <span className="ok">{savedMsg}</span>}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
