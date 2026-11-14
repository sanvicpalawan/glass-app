"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { num } from "@/domain/format";

export default function SitesPage() {
  const { customers, sites, openings, addSite, removeSite, addOpening, removeOpening } = useStore();
  const [siteForm, setSiteForm] = useState({ customerId: "", name: "", address: "", notes: "" });
  const [openForm, setOpenForm] = useState({ siteId: "", reference: "", location: "", width: 1200, height: 1200, notes: "" });
  const [msg, setMsg] = useState("");

  async function submitSite(e: React.FormEvent) {
    e.preventDefault();
    if (!siteForm.customerId || !siteForm.name.trim()) return;
    const cust = customers.find(c => c.id === siteForm.customerId);
    await addSite({ ...siteForm, customerName: cust?.name });
    setSiteForm({ customerId: "", name: "", address: "", notes: "" });
    setMsg("Site saved.");
  }

  async function submitOpening(e: React.FormEvent) {
    e.preventDefault();
    if (!openForm.siteId || !openForm.reference.trim()) return;
    const site = sites.find(s => s.id === openForm.siteId);
    await addOpening({ ...openForm, customerId: site?.customerId, width: Number(openForm.width), height: Number(openForm.height) });
    setOpenForm({ siteId: "", reference: "", location: "", width: 1200, height: 1200, notes: "" });
    setMsg("Opening saved.");
  }

  return (
    <main className="page" style={{ display: "grid", gap: 18 }}>
      <h2 style={{ margin: 0 }}>Sites & openings (measurements)</h2>
      {msg && <div className="ok">{msg}</div>}
      <div className="grid-2">
        <section className="card">
          <h3>Add site</h3>
          <form onSubmit={(e)=>void submitSite(e)}>
            <label className="field"><span>Customer</span>
              <select value={siteForm.customerId} onChange={(e)=>setSiteForm({...siteForm,customerId:e.target.value})}>
                <option value="">Select customer</option>
                {customers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Site name</span><input value={siteForm.name} onChange={(e)=>setSiteForm({...siteForm,name:e.target.value})} placeholder="e.g. Beach House" /></label>
            <label className="field"><span>Address</span><input value={siteForm.address} onChange={(e)=>setSiteForm({...siteForm,address:e.target.value})} /></label>
            <label className="field"><span>Notes</span><input value={siteForm.notes} onChange={(e)=>setSiteForm({...siteForm,notes:e.target.value})} /></label>
            <button className="btn primary" type="submit">Save site</button>
          </form>

          <h3 style={{marginTop:18}}>Sites ({sites.length})</h3>
          {sites.length===0 ? <p style={{color:"var(--dim)"}}>No sites yet.</p> : (
            <div className="table-wrap"><table><thead><tr><th>Site</th><th>Customer</th><th>Address</th><th></th></tr></thead>
            <tbody>{sites.map(s=>(
              <tr key={s.id}><td><b>{s.name}</b></td><td>{s.customerName||"—"}</td><td>{s.address||"—"}</td><td><button className="btn" onClick={()=>void removeSite(s.id)}>Delete</button></td></tr>
            ))}</tbody></table></div>
          )}
        </section>

        <section className="card">
          <h3>Add opening (measurement)</h3>
          <form onSubmit={(e)=>void submitOpening(e)}>
            <label className="field"><span>Site</span>
              <select value={openForm.siteId} onChange={(e)=>setOpenForm({...openForm,siteId:e.target.value})}>
                <option value="">Select site</option>
                {sites.map(s=> <option key={s.id} value={s.id}>{s.name} ({s.customerName||"—"})</option>)}
              </select>
            </label>
            <div className="row">
              <label className="field"><span>Reference</span><input value={openForm.reference} onChange={(e)=>setOpenForm({...openForm,reference:e.target.value})} placeholder="W1 / D1" /></label>
              <label className="field"><span>Location</span><input value={openForm.location} onChange={(e)=>setOpenForm({...openForm,location:e.target.value})} placeholder="Living room" /></label>
            </div>
            <div className="row">
              <label className="field"><span>Width (mm)</span><input type="number" value={openForm.width} onChange={(e)=>setOpenForm({...openForm,width:Number(e.target.value)})} /></label>
              <label className="field"><span>Height (mm)</span><input type="number" value={openForm.height} onChange={(e)=>setOpenForm({...openForm,height:Number(e.target.value)})} /></label>
            </div>
            <label className="field"><span>Notes</span><input value={openForm.notes} onChange={(e)=>setOpenForm({...openForm,notes:e.target.value})} /></label>
            <button className="btn primary" type="submit">Save opening</button>
          </form>

          <h3 style={{marginTop:18}}>Openings ({openings.length})</h3>
          {openings.length===0 ? <p style={{color:"var(--dim)"}}>No openings yet.</p> : (
            <div className="table-wrap"><table><thead><tr><th>Ref</th><th>Site</th><th>Location</th><th className="num">Size</th><th></th></tr></thead>
            <tbody>{openings.map(o=>{ const site=sites.find(s=>s.id===o.siteId); return (
              <tr key={o.id}><td><b>{o.reference}</b></td><td>{site?.name||"—"}</td><td>{o.location||"—"}</td><td className="num">{num(o.width)}×{num(o.height)}</td><td><button className="btn" onClick={()=>void removeOpening(o.id)}>Delete</button></td></tr>
            );})}</tbody></table></div>
          )}
        </section>
      </div>
    </main>
  );
}
