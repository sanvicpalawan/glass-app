# Fenestra — the software

**What it is:** a window & door quoting and production system for fabricators and installers.
A salesperson measures an opening, configures the unit, and gets a priced quote, a drawing, a cut
list and a glass order in minutes. The order then flows to production without retyping.

**Who pays:** aluminium/UPVC fabricators, glazing contractors, and design-and-build firms. In
Palawan: the fabricators supplying resorts, hotels and residential builds.

**Why it exists:** every fabricator we know quotes from Excel and a calculator. The quoting is slow,
the cut lists are hand-written, and mistakes cost real money in remakes.

---

## Status legend

- `[ ]` not started · `[~]` in progress · `[x]` done and verified

---

## The ten modules

### 1. Auth & tenancy `[ ]`
Companies (tenants), users, roles. A fabricator signs up and gets their own catalogue, customers
and quotes. Roles: owner, sales, estimator, production, viewer.
**Screens:** sign in, invite user, user list, company settings.

### 2. Customers & sites `[ ]`
A customer has contacts, addresses and sites. A site has openings. An opening has a reference
("Living room — south"), a size, and one or more configured units.
**Screens:** customer list, customer detail, site list, opening list.

### 3. Catalogue `[ ]`
The heart of the system and the thing that makes it *their* software, not a generic calculator:
- **Series** — profile systems (50/70/100 mm sliding, casement, door). Each has face widths,
  rebate, overlap, max panel size, RO rules.
- **Option categories → options → answers** — colour, glass, hardware, screen, sill, grille.
  An answer carries a stock code, abbreviation, colour and a price adjustment.
- **Price lists** — per supplier, per series, effective-dated.
**Screens:** series list/editor, option builder, answer editor, price list editor.

### 4. Configurator `[~]` — engine proven, needs to become a screen in the app
Geometry, rough opening, options, live price, elevation, cut list, glass order, DXF.
**Screens:** opening → configure, design detail with tabs (Options / Dimensions / View / Price).

### 5. Quotes `[ ]`
Build a quote from one or many configured units. Version and revise. Discount at line, group or
order level. VAT. Export PDF. Email. Mark won/lost.
**Screens:** quote list, quote editor, quote preview/PDF, revisions.

### 6. Orders `[ ]`
A won quote becomes an order with a job number. Order lines carry the frozen design (so a later
price change does not rewrite history).
**Screens:** order list, order detail, job card.

### 7. Production `[ ]`
Cut list by member, bar-length nesting (how many 6 m bars to buy), glass order by pane, hardware
pick list, packing list, barcode per unit.
**Screens:** production board, cut list sheet, glass order, bar optimiser.

### 8. Pricing & cost `[ ]`
Supplier cost vs sell price. Margin per line and per order. Customer-group price lists. Approval
threshold for discounts.
**Screens:** cost sheet, margin report, discount rules.

### 9. Admin `[ ]`
Tax rates, units (metric / imperial decimal / imperial fraction), document numbering, branding,
logo on PDF, terms.

### 10. Reports `[ ]`
Pipeline value, win rate, average order value, margin by series, production load.

---

## Build order

**Phase 1 — sell something (the only phase that matters right now)**
Catalogue (3) + Configurator (4) + Quotes (5) + minimal auth (1).
Output: a fabricator can configure a unit and hand a customer a priced PDF. That is a product
somebody will pay for.

**Phase 2 — deliver it**
Orders (6) + production paperwork (7). Cut list, bar nesting, glass order.

**Phase 3 — run the business on it**
Customers/sites (2), pricing rules (8), admin (9), reports (10).

---

## Data model (Phase 1)

```
company        tenant
user           belongs to company, has role
customer       belongs to company
site           belongs to customer
opening        belongs to site, has reference + width/height
series         profile system, per company (or shared library)
ro_rule        per series: measure type → w/h allowance
option_def     category, name, type (choice | size | text)
option_answer  belongs to option_def: stock code, label, rgb, adjust
design         belongs to opening: series, item type, w/h, ro, status
design_option  design + option_def + chosen answer (+ free text / size)
price_list     per company/supplier, effective dated
price_item     series + member/glass/hardware → rate
quote          belongs to customer, has number, status, vat, discount
quote_line     quote + design snapshot + qty + unit price
order          won quote
```

Designs are **snapshotted** into quote lines. A design can change; a sent quote cannot.

---

## Stack

- **Next.js 16** (App Router, TypeScript) — matches everything else we run.
- **Postgres** — Supabase, already in the stack.
- **Drizzle ORM** — already used in `dashboard` and `dubbl`.
- **Vercel** for the app.
- No new paid services.

The geometry, pricing and DXF code is **pure TypeScript with no framework dependency** in
`src/domain/`, so it can be unit-tested and reused by a CLI, a PDF worker or a mobile app later.

---

## What already exists

| Thing | Where | State |
|---|---|---|
| Geometry + pricing + cut list + glass + DXF, single file | `prototype/index.html` | working, verified |
| OpenJanela domain model (RO rules, option engine, item types, order shape) | `../merqato/docs/research/openjanela-domain-model.md` | captured from the live app |
| Landscape of every open/commercial option with licences | `../merqato/docs/research/fenestration-software-landscape.md` | done |

The prototype is the reference implementation of the engine. It is not the product.
