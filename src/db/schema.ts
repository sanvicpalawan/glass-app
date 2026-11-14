/**
 * Database schema (Phase 1).
 *
 * Design rule: catalogue rows are data, not code. A fabricator's series, options and
 * price list live in these tables, so onboarding a new supplier is an import — not a
 * deployment.
 *
 * Quote lines hold a JSON snapshot of the design and its price. That is deliberate: a
 * sent quote must stay reproducible even after the catalogue changes.
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------- tenancy ------------------------------- */

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  currency: text("currency").notNull().default("PHP"),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("12.00"),
  defaultMargin: numeric("default_margin", { precision: 5, scale: 2 }).notNull().default("35.00"),
  /** Display units: mm | in-dec | in-frac */
  units: text("units").notNull().default("mm"),
  logoUrl: text("logo_url"),
  terms: text("terms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("companies_slug_uq").on(t.slug)]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  /** owner | sales | estimator | production | viewer */
  role: text("role").notNull().default("sales"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("users_email_uq").on(t.email)]);

/* ------------------------------ customers ------------------------------ */

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("customers_company_idx").on(t.companyId)]);

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("sites_customer_idx").on(t.customerId)]);

/** One hole in the wall. Holds the measured size and the units that fill it. */
export const openings = pgTable("openings", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  reference: text("reference").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("openings_site_idx").on(t.siteId)]);

/* ------------------------------ catalogue ------------------------------ */

export const series = pgTable("series", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  face: integer("face").notNull(),
  rebate: integer("rebate").notNull(),
  stile: integer("stile").notNull(),
  sashClear: integer("sash_clear").notNull(),
  overlap: integer("overlap").notNull(),
  ratePerMetre: numeric("rate_per_metre", { precision: 12, scale: 2 }).notNull(),
  maxPanelWidth: integer("max_panel_width").notNull(),
  maxHeight: integer("max_height").notNull(),
  /** RoRule[] — see src/domain/types.ts */
  roRules: jsonb("ro_rules").notNull(),
  operations: jsonb("operations").notNull(),
  active: boolean("active").notNull().default(true),
}, (t) => [uniqueIndex("series_company_code_uq").on(t.companyId, t.code)]);

export const optionDefs = pgTable("option_defs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  /** choice | size | text */
  kind: text("kind").notNull().default("choice"),
  defaultValue: text("default_value"),
  displaySeq: integer("display_seq").notNull().default(0),
  active: boolean("active").notNull().default(true),
}, (t) => [uniqueIndex("option_defs_company_code_uq").on(t.companyId, t.code)]);

export const optionAnswers = pgTable("option_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  optionDefId: uuid("option_def_id").notNull().references(() => optionDefs.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  label: text("label").notNull(),
  /** 0-255 triple, used to paint the elevation. */
  rgb: jsonb("rgb"),
  /** Fractional adjustment, e.g. 0.12 = +12% on the profile cost. */
  adjust: numeric("adjust", { precision: 8, scale: 4 }).notNull().default("0"),
  custom: boolean("custom").notNull().default(false),
  displaySeq: integer("display_seq").notNull().default(0),
  active: boolean("active").notNull().default(true),
}, (t) => [uniqueIndex("option_answers_def_code_uq").on(t.optionDefId, t.code)]);

/* ------------------------------- designs ------------------------------- */

export const designs = pgTable("designs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  openingId: uuid("opening_id").references(() => openings.id, { onDelete: "set null" }),
  seriesId: uuid("series_id").notNull().references(() => series.id),
  reference: text("reference"),
  /** Full Design object — see src/domain/types.ts */
  config: jsonb("config").notNull(),
  /** Cached so lists do not have to re-run the engine. */
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("designs_company_idx").on(t.companyId)]);

/* -------------------------------- quotes ------------------------------- */

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  number: text("number").notNull(),
  /** draft | sent | won | lost | expired */
  status: text("status").notNull().default("draft"),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("12.00"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  net: numeric("net", { precision: 14, scale: 2 }).notNull().default("0"),
  vat: numeric("vat", { precision: 14, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("quotes_company_number_uq").on(t.companyId, t.number)]);

/**
 * A quote line is frozen. `snapshot` holds the design, geometry, rough opening and price
 * exactly as they were when the line was added.
 */
export const quoteLines = pgTable("quote_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  designId: uuid("design_id").references(() => designs.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull(),
  /** QuoteLineSnapshot — see src/domain/types.ts */
  snapshot: jsonb("snapshot").notNull(),
  displaySeq: integer("display_seq").notNull().default(0),
}, (t) => [index("quote_lines_quote_idx").on(t.quoteId)]);

/* -------------------------------- orders ------------------------------- */

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  quoteId: uuid("quote_id").references(() => quotes.id, { onDelete: "set null" }),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  number: text("number").notNull(),
  /** confirmed | in_production | ready | installed | closed */
  status: text("status").notNull().default("confirmed"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("orders_company_number_uq").on(t.companyId, t.number)]);

/* ------------------------------ app store ------------------------------ */

/** Generic document store for app data (customers, quotes, predefined, etc.). */
export const appStore = pgTable("app_store", {
  id: text("id").primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  collection: text("collection").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("app_store_company_collection_idx").on(t.companyId, t.collection)]);
