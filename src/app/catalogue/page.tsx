import { SERIES, COLOURS, GLASS_LABELS, HARDWARE_LABELS, ITEM_TYPES, OPERATION_LABELS, RATES, MATERIAL_LABELS, materials } from "@/domain/catalogue";
import { num, peso } from "@/domain/format";

export default function CataloguePage() {
  const mats = materials();
  return (
    <main className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <h2>Material families & series</h2>
        <p style={{ color: "var(--dim)", marginTop: 0, fontSize: 12 }}>
          Aluminum, PVC/uPVC, Wood, Fiberglass and specialty systems. Each series drives geometry (face/rebate/stile/overlap), RO rules and base rates.
          Replace with your supplier datasheets in <code>src/domain/catalogue.ts</code> (DB-backed editor next).
        </p>
        {mats.map((m) => (
          <div key={m} style={{ marginBottom: 18 }}>
            <h3 style={{ margin: "8px 0" }}>{MATERIAL_LABELS[m]}</h3>
            <div className="table-wrap"><table>
              <thead><tr><th>Series</th><th>Family</th><th className="num">Face</th><th className="num">Rebate</th><th className="num">Max panel</th><th className="num">Max H</th><th className="num">Rate/m</th><th>Operations</th></tr></thead>
              <tbody>
                {SERIES.filter((s) => s.material === m).map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.name}</b> <span style={{ color: "var(--dim)" }}>({s.id})</span></td>
                    <td>{s.family}</td>
                    <td className="num">{s.face}</td>
                    <td className="num">{s.rebate}</td>
                    <td className="num">{num(s.maxPanelWidth)}</td>
                    <td className="num">{num(s.maxHeight)}</td>
                    <td className="num">{peso(s.rate)}</td>
                    <td style={{ fontSize: 11, color: "var(--dim)" }}>{s.operations.map((o) => OPERATION_LABELS[o]).slice(0, 4).join(", ")}{s.operations.length > 4 ? "…" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        ))}
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Finish colours (answers)</h2>
          <div className="table-wrap"><table>
            <thead><tr><th>Code</th><th>Label</th><th>Swatch</th><th className="num">Adjust</th></tr></thead>
            <tbody>
              {COLOURS.answers.map((a) => (
                <tr key={a.code}>
                  <td><code>{a.code}</code></td>
                  <td>{a.label}{a.custom ? " *" : ""}</td>
                  <td><span style={{ display: "inline-block", width: 18, height: 18, borderRadius: 4, background: `rgb(${a.rgb.join(",")})`, border: "1px solid var(--line)" }} /></td>
                  <td className="num">{a.adjust ? `${a.adjust > 0 ? "+" : ""}${Math.round(a.adjust * 100)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>

        <section className="card">
          <h2>Rates & item types</h2>
          <h3 style={{ marginTop: 0 }}>Glass (₱/m²)</h3>
          <div className="table-wrap"><table><tbody>{Object.entries(GLASS_LABELS).map(([k, v]) => <tr key={k}><td>{v}</td><td className="num">{peso((RATES.glass as any)[k])}</td></tr>)}</tbody></table></div>
          <h3>Hardware (₱/leaf)</h3>
          <div className="table-wrap"><table><tbody>{Object.entries(HARDWARE_LABELS).map(([k, v]) => <tr key={k}><td>{v}</td><td className="num">{peso((RATES.hardware as any)[k])}</td></tr>)}</tbody></table></div>
          <h3>Item types</h3>
          <div className="table-wrap"><table><thead><tr><th>Type</th><th className="num">Profile</th><th className="num">Glass</th><th className="num">HW</th><th className="num">Labour</th></tr></thead>
            <tbody>{Object.entries(ITEM_TYPES).map(([k, v]) => (<tr key={k}><td>{v.label}</td><td className="num">{v.profile}</td><td className="num">{v.glass}</td><td className="num">{v.hardware}</td><td className="num">{v.labour}</td></tr>))}</tbody>
          </table></div>
        </section>
      </div>
    </main>
  );
}
