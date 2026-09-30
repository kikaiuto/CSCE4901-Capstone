# ADR 0001 — Odoo-style addon layout

- **Status:** accepted
- **Date:** 2026-09-30
- **Supersedes:** the eleven-module layout under `backend/app/modules/`

## Context

The skeleton had eleven backend modules (`tenancy`, `auth`, `customers`,
`catalog`, `inventory`, `sales`, `procurement`, `accounting`, `reporting`,
`forecasting`, `ai`). Information architecture diagram D-03 in
`Sector7_Product_Design.pdf` names an Admin Workspace plus four operational
modules — Sales & CRM, Inventory, Procurement, Accounting — with the AI layer and
ForecastingWorker on top. Four of the eleven modules owned no screen and had no
place in the sidebar.

Nothing tied the pieces together. There was no manifest, no declared dependency
between modules, and no loader; `main.py` said only that it "wires every module
router." On the frontend the module list was written out four separate times, in
the route table, the sidebar, the icon set, and the sign-in screen.

Five people start building in parallel in Sprint 1, and in Sprint 2 three of the
five tracks begin writing into each other. A boundary that exists only as a
folder name does not survive that.

## Decision

Adopt Odoo's structural conventions — an addon per business domain, each with a
manifest declaring its dependencies, and a loader that resolves the graph — while
writing no framework of our own.

**Eight addons**, matching D-03 and the five sprint tracks:

| Addon | Track | Screens | Owns |
| --- | --- | --- | --- |
| `base` | PLT | S-01, S-09 | Organization, User |
| `sales` | SLS | S-03, S-04 | Customer, SalesOrder, SalesOrderLine |
| `inventory` | INV | S-05 | ProductCategory, Product, InventoryLedger |
| `procurement` | INV | S-06 | Supplier, PurchaseOrder, PurchaseOrderLine |
| `accounting` | ACC | S-07, S-10 | ChartOfAccounts, JournalEntry, JournalEntryLine |
| `ai` | AIX | S-08 | AI-owned logs only |
| `forecasting` | AIX | S-05 overlay | Forecast |
| `home` | AIX | S-02 | nothing; assembles from the registry |

The collapse: `tenancy` + `auth` became `base`, `customers` merged into `sales`,
`catalog` merged into `inventory`, and `reporting` split between `accounting`
(financial statements, R23) and `home` (operational dashboard, R24).

**What we took from Odoo:** the addon directory per domain, `__manifest__.py`
with a `depends` list, a dependency-graph loader, per-addon `security/`, `data/`
and `tests/` directories, and a registry that addons contribute to instead of
importing one another.

**What we did not take:** Odoo's ORM, its declarative XML view engine, its dotted
model names, and its `ir.*` metadata tables. We keep SQLAlchemy 2.0, Pydantic,
and React. Building a framework before building the ERP does not fit 8.5 weeks.

## Consequences

The dependency graph is also the sprint plan. Sprint 1 exercises no cross-addon
edge, because each addon's own data has to be correct in isolation. Sprint 2
lights up `sales → accounting` and `procurement → accounting`. Sprint 3 assembles
`home` and `ai` from the registry.

The AI isolation rule becomes enforceable. `ai` declares only `base`, so
`backend/tests/architecture/test_addon_deps.py` fails any import that reaches a
core ORM model or session. Previously the rule was stated in eight docstrings and
checked nowhere.

The traceability matrix had to be rewritten, which is how we found that about a
third of its `Module` values were wrong — it had been generated before the
requirements document was available. See `docs/requirements/traceability.md`.

Every addon now has at least one screen and one owning track. A module nobody
demos is a module nobody finishes.

## Alternatives considered

**Keep eleven modules and add manifests.** Every existing `R → module` row would
have stayed valid and no docstring would have moved. Rejected because four addons
would still own no screen, so the skeleton would keep contradicting the diagram
we are graded against.

**Full Odoo mimicry** — declarative views as data, a custom ORM layer,
`ir.model.access` CSVs driving RBAC. Closest to Odoo and rejected outright: it
means writing a framework during the term we are meant to be writing the product.

**Odoo's short module names** (`sale`, `stock`, `purchase`, `account`). The
strongest Odoo signal, but none of those words appear in our design doc or
wireframes, so every traceability row would need translating. We kept the design
doc's vocabulary and settled `procurement` over `purchasing` for the one word
where the backend and the sidebar disagreed.

**Odoo's unified `res.partner`** in place of separate `Customer` and `Supplier`.
Rejected: ER diagram D-02 declares them as separate entities and requirements
R5/R6 and R16 are written against them. Changing the data model to match Odoo
would mean revising a submitted design document to suit an implementation detail.
If the two ever need shared contact handling, that is the point to revisit.
