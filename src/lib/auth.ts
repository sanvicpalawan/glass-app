/**
 * Auth scaffold.
 *
 * Phase 1 stores data in localStorage (no server auth). When DATABASE_URL is set,
 * replace this with real session auth (e.g. Lucia/NextAuth/iron-session) backed by
 * the `users` table in src/db/schema.ts. `AUTH_SECRET` must be set in production.
 */

export type Role = "owner" | "sales" | "estimator" | "production" | "viewer";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string;
}

export function authConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET);
}

/** Placeholder: returns null until DB-backed auth is wired. */
export async function getSession(): Promise<SessionUser | null> {
  if (!authConfigured()) return null;
  // TODO: read session cookie, verify, load user from db
  return null;
}
