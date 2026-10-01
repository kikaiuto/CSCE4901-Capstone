# CLAUDE.md

Project rules for Sector 7 AI. These constraints hold across the whole codebase.
Follow them without being asked again.

## AI layer isolation

The operational ERP core is deterministic. `backend/app/addons/ai/` is an isolated,
read-only layer.

- `addons/ai/` must never import core ORM models or core DB session objects.
- No core addon may import anything from `addons/ai/`.
- The AI layer reads data only through explicit read-only interfaces, and never
  writes to operational ERP tables.
- AI output is advisory. It must never be the source of a ledger entry, a stock
  movement, or any other authoritative record.

## Money

- Money is `Decimal` only. Never `float`.
- Ledger amounts: `NUMERIC(15, 2)`.
- Unit costs: `NUMERIC(12, 4)`.

## Multi-tenancy

- Every table carries `organization_id`.
- Every query is scoped by `organization_id`. No exceptions.

## Totals

- Totals, subtotals, taxes, and balances are computed server-side.
- Client-supplied totals are never trusted or persisted.

## SQL

- All database access goes through SQLAlchemy ORM constructs with bound parameters.
- Never build SQL by string interpolation or concatenation.

## Addon layout

Business code lives in addons under `backend/app/addons/<name>/`. Framework code
lives in `backend/app/core/` and never imports an addon.

There are eight addons, one per branch of information architecture diagram D-03:
`base`, `sales`, `inventory`, `procurement`, `accounting`, `ai`, `forecasting`,
and `home`. Adding an addon means adding a manifest, not editing `main.py`.

| Path | Responsibility |
| --- | --- |
| `__init__.py` | Package marker |
| `__manifest__.py` | Addon declaration: `depends`, `screens`, `requirements`, `features` |
| `router.py` | FastAPI route declarations |
| `schemas.py` | Pydantic V2 request and response schemas |
| `models.py` | SQLAlchemy 2.0 ORM models |
| `service.py` | Business logic and orchestration |
| `repository.py` | Data access queries |
| `permissions.py` | RBAC permission definitions and checks |
| `security/access.md` | The role by action matrix `RBACGuard` enforces |
| `data/demo.py` | This addon's rows in the seed tenants |
| `tests/` | Service, route, and cross-tenant tests owned by this addon |

Routers call services. Services call repositories. Repositories are the only
place that touches the database.

Any of `router`, `schemas`, `models`, `service`, `repository`, or `permissions`
may become a package when it outgrows one file (`models/product.py`,
`models/inventory_ledger.py`). The names stay the same either way.

## Addon dependencies

An addon may import only from `app.core` and from the addons listed in its own
manifest's `depends`. `backend/tests/architecture/test_addon_deps.py` enforces
this, so an undeclared import fails CI rather than review.

`ai` and `home` depend on `base` alone. They reach the operational addons through
the read-only contracts in `app/core/contracts/` and the categories in
`app/core/registry.py`, never by importing them. This is what makes the AI layer
isolation rule above machine-checkable.

## Frontend layout

The frontend mirrors the same split. Framework code lives in `frontend/src/core/`,
business code in `frontend/src/addons/<name>/`, one directory per backend addon.

| Path | Holds |
| --- | --- |
| `manifest.ts` | `name`, `depends`, `screens`, and an optional `nav` entry |
| `screens/` | One component per wireframe screen |
| `components/` | Pieces used by this addon's screens |
| `fixtures/` | Stand-in data, shaped as the endpoint response it will become |
| `hooks/` | This addon's hooks |

`depends` and `screens` mirror `__manifest__.py`. The `nav` entry is frontend-only:
addons without a rail destination, such as `ai` and `forecasting`, omit it.

**An addon may import from `@/core` and from the addons in its own `depends`,
nothing else.** `src/core/app/addonDeps.test.ts` enforces this and also rejects
cycles, so an undeclared import fails the suite rather than review. It is the
counterpart to `backend/tests/architecture/test_addon_deps.py`, and it exists
because the first version of the S-05 forecast overlay had `inventory` importing
`forecasting`, inverting the declared direction with nothing to catch it.

Addons contribute to the other direction through core rather than importing each
other, the same way the backend registry works. `forecasting` owns the S-05 chart
overlay; it registers that contribution in `src/core/app/overlays.ts`, and the
inventory screen asks core for it by screen id. Core is the only assembly point,
and the same test pins which core files are allowed to reach into an addon.

Charts are the other enforced boundary. No addon imports `recharts`; charts go
through `src/core/components/charts`, which owns the axis and legend rules. ESLint
blocks the import from `src/addons/**`, and blocks `yAxisId` and
`orientation="right"` inside the chart layer, because the design system forbids a
dual-axis chart and Recharts makes one a two-line change.

Controls that would write data render visibly inert rather than looking live — see
the unwired convention in `docs/design/design-system.md`. Remove the prop when the
endpoint behind the control exists; `src/core/app/unwired.test.tsx` checks every
screen, so wiring one up without removing it fails rather than passing quietly.
