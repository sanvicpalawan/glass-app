import { NextResponse } from "next/server";
import { getItem, putItem } from "@/lib/db-store";
import { defaultSettings, mergeSettings } from "@/lib/settings";

export async function GET() {
  try {
    const saved = await getItem("settings", "default");
    const settings = mergeSettings(saved);
    return NextResponse.json({ ok: true, settings });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const settings = mergeSettings(body);
    await putItem("settings", "default", settings);
    return NextResponse.json({ ok: true, settings });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
