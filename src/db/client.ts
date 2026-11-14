import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  // Allow build without a database; runtime DB access will throw a clear error.
  console.warn("DATABASE_URL is not set — database features are disabled.");
}

const client = url ? postgres(url, { prepare: false }) : (null as unknown as ReturnType<typeof postgres>);
export const db = url ? drizzle(client, { schema }) : (null as unknown as ReturnType<typeof drizzle>);

export function requireDb() {
  if (!url || !db) throw new Error("DATABASE_URL is not configured");
  return db;
}
