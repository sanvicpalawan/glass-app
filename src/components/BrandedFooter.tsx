"use client";

import { useStore } from "@/lib/store";

export function BrandedFooter() {
  const { settings } = useStore();
  const c = settings.company;
  return (
    <footer className="app-footer">
      {c.name || "Fenestra"} — {c.footerText || "Window & door quoting and production."} Data saved in Neon.
      {c.address ? ` · ${c.address}` : ""}{c.website ? ` · ${c.website}` : ""}
    </footer>
  );
}
