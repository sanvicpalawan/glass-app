import { NextResponse } from "next/server";
import { getItem, listCollection, nextInvoiceNumber, nextOrderNumber, nextPoNumber, nextQuoteNumber, putItem } from "@/lib/db-store";
import { mergeSettings } from "@/lib/settings";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export async function GET(_req: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection } = await params;
    const items = await listCollection(collection);
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection } = await params;
    const body = await req.json();
    const id = body.id || uid();
    let item = { ...body, id, createdAt: body.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    if ((collection === "quotes" || collection === "orders" || collection === "invoices") && !item.number) {
      const s = mergeSettings(await getItem("settings", "default"));
      if (collection === "quotes") item.number = await nextQuoteNumber(s.quote.prefix, s.quote.nextNumber);
      if (collection === "orders") item.number = await nextOrderNumber();
      if (collection === "invoices") item.number = await nextInvoiceNumber(s.invoice.prefix, s.invoice.nextNumber);
    }
    if (collection === "purchases" && !item.number) item.number = await nextPoNumber();
    await putItem(collection, id, item);
    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
