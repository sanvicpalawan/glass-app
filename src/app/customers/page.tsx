"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export default function CustomersPage() {
  const { customers, addCustomer } = useStore();
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", address: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await addCustomer(form);
    setForm({ name: "", contact: "", phone: "", email: "", address: "" });
  }

  return (
    <main className="page grid-sidebar">
      <section className="card">
        <h2>Add customer</h2>
        <form onSubmit={submit}>
          <label className="field"><span>Name *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field"><span>Contact person</span><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></label>
          <div className="row">
            <label className="field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="field"><span>Email</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          </div>
          <label className="field"><span>Address</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
          <button className="btn primary" type="submit">Save customer</button>
        </form>
      </section>

      <section className="card">
        <h2>Customers ({customers.length})</h2>
        {customers.length === 0 ? (
          <p style={{ color: "var(--dim)", margin: 0 }}>No customers yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>Address</th></tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td><b>{c.name}</b></td>
                    <td>{c.contact || "—"}</td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.email || "—"}</td>
                    <td>{c.address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
