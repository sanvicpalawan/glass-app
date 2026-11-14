import { and, eq, sql } from "drizzle-orm";
import { requireDb } from "@/db/client";
import { appStore, companies } from "@/db/schema";

const COMPANY_SLUG = "default";
const COMPANY_NAME = "Fenestra";

export type Collection = string;

export async function ensureCompany() {
  const db = requireDb();
  const existing = await db.select().from(companies).where(eq(companies.slug, COMPANY_SLUG)).limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db
    .insert(companies)
    .values({ name: COMPANY_NAME, slug: COMPANY_SLUG })
    .onConflictDoNothing({ target: companies.slug })
    .returning();
  if (inserted[0]) return inserted[0];
  const again = await db.select().from(companies).where(eq(companies.slug, COMPANY_SLUG)).limit(1);
  if (!again[0]) throw new Error("Failed to ensure default company");
  return again[0];
}

export async function listCollection<T = any>(collection: Collection): Promise<T[]> {
  const db = requireDb();
  const company = await ensureCompany();
  const rows = await db
    .select()
    .from(appStore)
    .where(and(eq(appStore.companyId, company.id), eq(appStore.collection, collection)));
  return rows.map((r) => r.data as T);
}

export async function getItem<T = any>(collection: Collection, id: string): Promise<T | null> {
  const db = requireDb();
  const company = await ensureCompany();
  const rows = await db
    .select()
    .from(appStore)
    .where(and(eq(appStore.companyId, company.id), eq(appStore.collection, collection), eq(appStore.id, id)))
    .limit(1);
  return (rows[0]?.data as T) || null;
}

export async function putItem(collection: Collection, id: string, data: any) {
  const db = requireDb();
  const company = await ensureCompany();
  await db
    .insert(appStore)
    .values({ id, companyId: company.id, collection, data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appStore.id,
      set: { data, collection, companyId: company.id, updatedAt: new Date() },
    });
  return data;
}

export async function deleteItem(collection: Collection, id: string) {
  const db = requireDb();
  const company = await ensureCompany();
  await db
    .delete(appStore)
    .where(and(eq(appStore.companyId, company.id), eq(appStore.collection, collection), eq(appStore.id, id)));
}

async function nextNumber(prefix: string, collection: string, field = "number", start = 1000) {
  const db = requireDb();
  const company = await ensureCompany();
  const key = `seq:${collection}:${company.id}`;
  const rows = await db
    .select()
    .from(appStore)
    .where(and(eq(appStore.companyId, company.id), eq(appStore.collection, "meta"), eq(appStore.id, key)))
    .limit(1);
  let n = start - 1;
  if (rows[0]) {
    n = Math.max(Number((rows[0].data as any)?.n || start - 1), start - 1);
  } else {
    const existing = await listCollection<any>(collection);
    const maxNum = existing.reduce((m, item) => {
      const match = String(item[field] || "").match(/(\d+)$/);
      return match ? Math.max(m, Number(match[1])) : m;
    }, start - 1);
    n = Math.max(maxNum, start - 1);
  }
  n += 1;
  await putItem("meta", key, { n });
  return `${prefix}-${n}`;
}

export async function nextQuoteNumber(prefix = "Q", start = 1001): Promise<string> { return nextNumber(prefix, "quotes", "number", start); }
export async function nextOrderNumber(prefix = "ORD", start = 1001): Promise<string> { return nextNumber(prefix, "orders", "number", start); }
export async function nextInvoiceNumber(prefix = "INV", start = 1001): Promise<string> { return nextNumber(prefix, "invoices", "number", start); }
export async function nextPoNumber(prefix = "PO", start = 1001): Promise<string> { return nextNumber(prefix, "purchases", "number", start); }
