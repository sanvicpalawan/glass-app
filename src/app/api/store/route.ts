import { NextResponse } from "next/server";
import { listCollection } from "@/lib/db-store";

export async function GET() {
  try {
    const [customers, quotes, predefined, sites, openings, orders, invoices, inventory, purchases, settingsArr] = await Promise.all([
      listCollection("customers"),
      listCollection("quotes"),
      listCollection("predefined"),
      listCollection("sites"),
      listCollection("openings"),
      listCollection("orders"),
      listCollection("invoices"),
      listCollection("inventory"),
      listCollection("purchases"),
      listCollection("settings"),
    ]);
    const sortDesc = (arr: any[]) => arr.sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
    sortDesc(quotes); sortDesc(predefined); sortDesc(orders); sortDesc(invoices); sortDesc(purchases); sortDesc(sites); sortDesc(openings);
    customers.sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")));
    const settings = settingsArr.find((s: any) => s && (s.company || s.quote || s.invoice)) || settingsArr[0] || null;
    return NextResponse.json({ ok: true, customers, quotes, predefined, sites, openings, orders, invoices, inventory, purchases, settings });
  } catch (e: any) {
    const msg = [e?.message, e?.cause?.message, e?.code, e?.detail].filter(Boolean).join(" | ");
    return NextResponse.json({ ok: false, error: msg || String(e) }, { status: 500 });
  }
}
