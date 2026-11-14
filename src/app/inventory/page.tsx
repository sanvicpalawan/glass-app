"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { peso } from "@/domain/format";

export default function InventoryPage() {
  const { inventory, purchases, saveInventoryItem, removeInventoryItem, savePurchase, updatePurchase } = useStore();
  const [tab, setTab] = useState<"stock"|"purchasing">("stock");
  const [item, setItem] = useState({ sku: "", name: "", category: "Profile", unit: "m", qty: 0, minQty: 0, cost: 0, notes: "" });
  const [po, setPo] = useState({ supplier: "", status: "draft" as const, itemsText: "ALU-001, Aluminium profile, 10, 250", notes: "" });

  async function addItem(e: React.FormEvent) {
    e.preventDefault(); if(!item.sku||!item.name) return;
    await saveInventoryItem({ ...item, qty: Number(item.qty), minQty: Number(item.minQty), cost: Number(item.cost) });
    setItem({ sku: "", name: "", category: "Profile", unit: "m", qty: 0, minQty: 0, cost: 0, notes: "" });
  }

  async function addPo(e: React.FormEvent) {
    e.preventDefault(); if(!po.supplier) return;
    const items = po.itemsText.split("\n").map(l=>l.split(",").map(s=>s.trim())).filter(a=>a[0]).map(a=>{const qty=Number(a[2]||0), unitCost=Number(a[3]||0); return {sku:a[0], name:a[1]||a[0], qty, unitCost, lineTotal: qty*unitCost};});
    const total = items.reduce((s,i)=>s+i.lineTotal,0);
    await savePurchase({ supplier: po.supplier, status: "draft", items, total, notes: po.notes });
    setPo({ supplier: "", status: "draft", itemsText: "", notes: "" });
  }

  return (
    <main className="page" style={{ display: "grid", gap: 18 }}>
      <div className="bar">
        <h2 style={{ margin: 0 }}>Inventory & purchasing</h2>
        <div className="bar">
          <button className={tab==="stock"?"btn primary":"btn"} onClick={()=>setTab("stock")}>Stock</button>
          <button className={tab==="purchasing"?"btn primary":"btn"} onClick={()=>setTab("purchasing")}>Purchasing</button>
        </div>
      </div>

      {tab==="stock" && (<>
        <section className="card">
          <h3>Add / update stock item</h3>
          <form onSubmit={(e)=>void addItem(e)} className="grid-form-4">
            <label className="field"><span>SKU</span><input value={item.sku} onChange={e=>setItem({...item,sku:e.target.value})} /></label>
            <label className="field"><span>Name</span><input value={item.name} onChange={e=>setItem({...item,name:e.target.value})} /></label>
            <label className="field"><span>Category</span><select value={item.category} onChange={e=>setItem({...item,category:e.target.value})}>{["Profile","Glass","Hardware","Screen","Seal","Accessory","Other"].map(c=><option key={c}>{c}</option>)}</select></label>
            <label className="field"><span>Unit</span><input value={item.unit} onChange={e=>setItem({...item,unit:e.target.value})} /></label>
            <label className="field"><span>Qty on hand</span><input type="number" value={item.qty} onChange={e=>setItem({...item,qty:Number(e.target.value)})} /></label>
            <label className="field"><span>Min qty</span><input type="number" value={item.minQty} onChange={e=>setItem({...item,minQty:Number(e.target.value)})} /></label>
            <label className="field"><span>Unit cost</span><input type="number" value={item.cost} onChange={e=>setItem({...item,cost:Number(e.target.value)})} /></label>
            <div style={{alignSelf:"end"}}><button className="btn primary" type="submit">Save item</button></div>
          </form>
        </section>
        <section className="card">
          <h3>Stock ({inventory.length})</h3>
          {inventory.length===0 ? <p style={{color:"var(--dim)"}}>No stock items.</p> : (
            <div className="table-wrap"><table><thead><tr><th>SKU</th><th>Name</th><th>Category</th><th className="num">Qty</th><th className="num">Min</th><th className="num">Cost</th><th>Status</th><th></th></tr></thead>
            <tbody>{inventory.map(it=>(
              <tr key={it.id}><td><b>{it.sku}</b></td><td>{it.name}</td><td>{it.category}</td><td className="num">{it.qty} {it.unit}</td><td className="num">{it.minQty}</td><td className="num">{peso(it.cost)}</td><td>{it.qty<=it.minQty?<span style={{color:"var(--warn)"}}>Low</span>:<span style={{color:"var(--ok)"}}>OK</span>}</td><td><button className="btn" onClick={()=>void removeInventoryItem(it.id)}>Delete</button></td></tr>
            ))}</tbody></table></div>
          )}
        </section>
      </>)}

      {tab==="purchasing" && (<>
        <section className="card">
          <h3>Create purchase order</h3>
          <form onSubmit={(e)=>void addPo(e)}>
            <div className="row">
              <label className="field"><span>Supplier</span><input value={po.supplier} onChange={e=>setPo({...po,supplier:e.target.value})} /></label>
              <label className="field"><span>Notes</span><input value={po.notes} onChange={e=>setPo({...po,notes:e.target.value})} /></label>
            </div>
            <label className="field"><span>Items (one per line: SKU, name, qty, unit cost)</span>
              <textarea value={po.itemsText} onChange={e=>setPo({...po,itemsText:e.target.value})} rows={4} style={{width:"100%",background:"var(--panel2)",color:"var(--txt)",border:"1px solid var(--line)",borderRadius:7,padding:"8px 10px"}} />
            </label>
            <button className="btn primary" type="submit">Save purchase order</button>
          </form>
        </section>
        <section className="card">
          <h3>Purchase orders ({purchases.length})</h3>
          {purchases.length===0 ? <p style={{color:"var(--dim)"}}>No purchase orders.</p> : (
            <div className="table-wrap"><table><thead><tr><th>PO</th><th>Supplier</th><th>Status</th><th className="num">Items</th><th className="num">Total</th><th>Actions</th></tr></thead>
            <tbody>{purchases.map(p=>(
              <tr key={p.id}><td><b>{p.number}</b></td><td>{p.supplier}</td>
                <td><select value={p.status} onChange={e=>void updatePurchase(p.id,{status:e.target.value as any, receivedAt: e.target.value==="received"?new Date().toISOString():p.receivedAt})} style={{padding:"4px 6px"}}>
                  <option value="draft">Draft</option><option value="ordered">Ordered</option><option value="received">Received</option><option value="cancelled">Cancelled</option>
                </select></td>
                <td className="num">{p.items.length}</td><td className="num">{peso(p.total)}</td>
                <td><button className="btn" onClick={()=>window.print()}>Print</button></td>
              </tr>
            ))}</tbody></table></div>
          )}
        </section>
      </>)}
    </main>
  );
}
