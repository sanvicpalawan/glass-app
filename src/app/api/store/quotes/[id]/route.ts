import { NextResponse } from "next/server";
import { deleteItem, getItem, putItem } from "@/lib/db-store";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await getItem<any>("quotes", id);
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const updated = { ...existing, ...body, id };
    await putItem("quotes", id, updated);
    return NextResponse.json({ ok: true, quote: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteItem("quotes", id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
