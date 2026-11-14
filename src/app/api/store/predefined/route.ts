import { NextResponse } from "next/server";
import { putItem } from "@/lib/db-store";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = { ...body, id: body.id || uid(), createdAt: body.createdAt || new Date().toISOString() };
    await putItem("predefined", item.id, item);
    return NextResponse.json({ ok: true, predefined: item });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
