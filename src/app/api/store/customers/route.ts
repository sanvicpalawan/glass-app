import { NextResponse } from "next/server";
import { putItem } from "@/lib/db-store";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const customer = { ...body, id: body.id || uid() };
    await putItem("customers", customer.id, customer);
    return NextResponse.json({ ok: true, customer });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
