import { NextResponse } from "next/server";
import postgres from "postgres";

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ ok: false, service: "postgres", error: "DATABASE_URL not set" }, { status: 500 });
  }
  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    const [row] = await sql`select 1 as ok, current_database() as db, now() as now`;
    const tables = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `;
    await sql.end();
    return NextResponse.json({
      ok: true,
      service: "postgres",
      provider: "neon",
      db: row.db,
      now: row.now,
      tables: tables.map((t: any) => t.table_name),
    });
  } catch (e: any) {
    try { await sql.end(); } catch {}
    return NextResponse.json({ ok: false, service: "postgres", error: e?.message || String(e) }, { status: 500 });
  }
}
