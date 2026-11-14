import { NextResponse } from "next/server";
import { deleteItem, getItem, putItem } from "@/lib/db-store";

export async function GET(_req: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  try {
    const { collection, id } = await params;
    const item = await getItem(collection, id);
    if (!item) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  try {
    const { collection, id } = await params;
    const body = await req.json();
    const existing = await getItem<any>(collection, id);
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
    await putItem(collection, id, updated);
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  try {
    const { collection, id } = await params;
    await deleteItem(collection, id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
