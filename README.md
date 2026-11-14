# Fenestra

Window & door quoting and production software for fabricators and installers.

**Stack:** Next.js 16 (App Router, TypeScript), Postgres + Drizzle (schema ready), pure-TS domain engine (no framework dependency).

## What it does now (Phase 1)

- **Configurator** — pick operation/series/size/RO rule/item type, set exterior+interior colour, glass, hardware, screen, rush. Live elevation drawing, rough opening, cut list, glass order, bar count, priced quote.
- **DXF export** — R12 elevation per unit.
- **Quote builder** — add configured units as frozen lines, discount, VAT, save to a quote, print/PDF.
- **Quotes** — list, status (draft/sent/won/lost), detail view.
- **Customers** — basic customer records.
- **Catalogue** — series, colours, rates, item types (seeded from `src/domain/catalogue.ts`).
- **Orders** — won quotes.
- **Production** — board view from won orders (bar nesting/batching next).
- **Domain engine** — `src/domain/` is pure TypeScript: geometry, pricing, RO rules, validation, DXF, quote snapshots. 20 unit tests.

## Run

```bash
npm install
npm run dev      # http://localhost:4180
npm run build
npm test         # domain tests (node --test)
npm run typecheck
```

Quotes and customers are stored in browser localStorage for now. The database schema is in `src/db/schema.ts` (Drizzle/Postgres) — wire `DATABASE_URL` and switch the store to the DB for multi-user use.

## Structure

- `src/domain/` — engine (types, catalogue, geometry, pricing, validation, dxf, quote, format). **No React, no DB.**
- `src/components/` — Configurator, Drawing, Nav
- `src/lib/store.tsx` — client store (localStorage); replace with DB-backed API
- `src/db/schema.ts` — full schema (companies, users, customers, sites, openings, series, options, designs, quotes, orders)
- `src/app/` — pages: `/` configure, `/quotes`, `/customers`, `/catalogue`, `/orders`, `/production`, `/settings`
- `prototype/` — original single-file reference
- `PLAN.md` — 10 modules and phases
- `docs/research/openjanela-domain-model.md` (in merqato workspace) — domain captured from a live system

## Replacing demo rates

Edit `src/domain/catalogue.ts`: series dimensions/rates, glass and hardware rates, labour, stock bar length, colour answers. This is the same shape the DB will hold.
