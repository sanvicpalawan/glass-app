"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Configure" },
  { href: "/quotes", label: "Quotes" },
  { href: "/customers", label: "Customers" },
  { href: "/sites", label: "Sites & Openings" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/orders", label: "Orders" },
  { href: "/invoices", label: "Invoices" },
  { href: "/production", label: "Production" },
  { href: "/inventory", label: "Inventory" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "10px 22px", borderBottom: "1px solid var(--line)", background: "var(--panel)", alignItems: "center" }}>
      {NAV.map((n) => {
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--line)", textDecoration: "none", fontSize: 12, color: active ? "#141414" : "var(--txt)", background: active ? "var(--accent)" : "var(--panel2)", fontWeight: active ? 600 : 400 }}>{n.label}</Link>
        );
      })}
      <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--dim)" }}>Fenestra — Neon DB</span>
        <ThemeToggle />
      </span>
    </nav>
  );
}
