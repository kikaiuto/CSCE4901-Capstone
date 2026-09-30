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
