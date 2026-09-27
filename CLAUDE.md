# CLAUDE.md

Project rules for Sector 7 AI. These constraints hold across the whole codebase.
Follow them without being asked again.

## AI layer isolation

The operational ERP core is deterministic. `backend/app/modules/ai/` is an isolated,
read-only layer.

- `modules/ai/` must never import core ORM models or core DB session objects.
- No core module may import anything from `modules/ai/`.
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

## Module file layout

Each module under `backend/app/modules/<name>/` contains:

| File | Responsibility |
| --- | --- |
| `__init__.py` | Package marker |
| `router.py` | FastAPI route declarations |
| `schemas.py` | Pydantic V2 request and response schemas |
| `models.py` | SQLAlchemy 2.0 ORM models |
| `service.py` | Business logic and orchestration |
| `repository.py` | Data access queries |
| `permissions.py` | RBAC permission definitions and checks |

Routers call services. Services call repositories. Repositories are the only
place that touches the database.
