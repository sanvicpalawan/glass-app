"use client";

import { useStore } from "@/lib/store";

export function BrandedHeader() {
  const { settings } = useStore();
  const c = settings.company;
  return (
    <header className="app-header">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {c.logoUrl ? <img src={c.logoUrl} alt={c.name} style={{ height: 34, objectFit: "contain" }} /> : null}
        <h1>{c.name || "Fenestra"}</h1>
      </div>
      <span className="tag">{c.footerText || "Window & door quoting and production"}{c.phone ? ` · ${c.phone}` : ""}{c.email ? ` · ${c.email}` : ""}</span>
    </header>
  );
}
