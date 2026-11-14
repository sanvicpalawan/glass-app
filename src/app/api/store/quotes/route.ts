import { NextResponse } from "next/server";
import { getItem, nextQuoteNumber, putItem } from "@/lib/db-store";
import { mergeSettings } from "@/lib/settings";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || uid();
    const s = mergeSettings(await getItem("settings", "default"));
    const number = body.number || (await nextQuoteNumber(s.quote.prefix, s.quote.nextNumber));
    const quote = { ...body, id, number, createdAt: body.createdAt || new Date().toISOString() };
    await putItem("quotes", id, quote);
    return NextResponse.json({ ok: true, quote });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
