# Architecture

## Context

## System Overview

## Multi-Tenancy Model

All tenants share one schema. `organization` is the tenant table; every other
table inherits `TenantScoped` from `core/tenancy.py`, which gives it an indexed,
non-null `organization_id` foreign key.

Scoping is enforced once, centrally, instead of by every query remembering a
filter:

- A tenant route takes its session from `get_tenant_session`, which binds the
  session to the organization in the caller's verified JWT.
- On a bound session, every ORM `SELECT`, `UPDATE`, and `DELETE` against a
  `TenantScoped` model gets `organization_id = <caller's org>` added before SQL
  is emitted. `session.get()` of another tenant's id returns `None`, the same as
  an id that does not exist.
- A flush that inserts a row into another organization, or moves a row to one,
  raises `CrossTenantWrite`. A new row with no `organization_id` takes the bound
  one.
- A session cannot be rebound to a different organization.
- A foreign key from one tenant row to another tenant table must point at a row
  of the same organization.
- A changed or deleted row is re-checked against the database under the filter,
  so an object forged into the session cannot reach another tenant by id.
- `organization` is scoped too: a bound session sees and changes only its own
  row, and cannot create one.
- The statement forms the filter cannot cover are refused with
  `CrossTenantWrite`: ORM `insert()` (use `session.add`), `UPDATE`/`DELETE` with
  a list of parameter sets, an `UPDATE` that sets `organization_id`, and the
  legacy `Session.bulk_*` methods.

Repositories therefore write plain ORM queries with no tenant filter of their
own. Outside the guarantee are textual SQL and raw `Table` statements
(`Model.__table__`), both of which `tests/architecture/test_addon_deps.py` bans
from addons, and the unbound session from `core/db.get_session`, which only
public routes such as sign-in may use.

`backend/tests/integration/test_tenant_isolation.py` proves the guarantee at the
session and HTTP layers with two seeded tenants.

## Module Boundaries

Business code lives in addons under `backend/app/addons/`. Framework code lives in
`backend/app/core/` and never imports an addon. There are eight addons, one per
branch of information architecture diagram D-03.

| Addon | Track | Screens | Depends on |
| --- | --- | --- | --- |
| `base` | PLT | S-01, S-09 | — |
| `inventory` | INV | S-05 | `base` |
| `accounting` | ACC | S-07, S-10 | `base` |
| `sales` | SLS | S-03, S-04 | `base`, `inventory`, `accounting` |
| `procurement` | INV | S-06 | `base`, `inventory`, `accounting` |
| `forecasting` | AIX | S-05 overlay | `base`, `sales`, `inventory` |
| `ai` | AIX | S-08 | `base` |
| `home` | AIX | S-02 | `base` |

Each addon declares its dependencies in `__manifest__.py`. `core/modules/graph.py`
resolves the declarations into a load order and rejects cycles;
`core/modules/loading.py` mounts each addon's router in that order. An addon may
import only from `app.core` and from the addons it declared, and
`backend/tests/architecture/test_addon_deps.py` fails the build otherwise.

Load order:

```
base -> accounting -> ai -> home -> inventory -> procurement -> sales -> forecasting
```

The graph doubles as the sprint plan. Sprint 1 exercises no cross-addon edge,
since each addon's own data has to be correct in isolation. Sprint 2 lights up
`sales -> accounting` and `procurement -> accounting`. Sprint 3 assembles the
`home` and `ai` surfaces from the registry.

Addons that need data from several tracks do not import them. They read the
categories in `core/registry.py`, which each addon contributes to: work queue
rows for S-02, deterministic dashboard metrics, read-only AI tools, and module
rail entries. This is why `home` can render a queue fed by four addons while
depending only on `base`.

Cross-addon calls go through the seven Protocols in `core/contracts/` — identity,
sales, inventory, procurement, accounting, forecasting, and assistant — never by
importing another addon's `service.py`.

## AI Layer Isolation

`addons/ai/` is read-only and isolated. It declares `base` as its only
dependency, so the dependency test makes the rule enforceable rather than
advisory: any import reaching a core ORM model or DB session fails CI.

The assistant sees the operational addons only through
`core/contracts/assistant.py`, whose methods are parameterized tools that take
the organization from the authenticated session and never from the model. Nothing
there writes. A request that would change data comes back as a draft the user
opens and confirms in the normal screen, under the same role checks as manual
work (S-08).

`ForecastingWorker` is a separate addon on the deterministic side. It runs
Holt-Winters in batch off the request path and returns `INSUFFICIENT_DATA` rather
than a number for a product without enough history. Requirements: R26, R28, R29.
Non-functional: NF8, NF9, NF11.

## Data Model

## Authentication and Authorization

Sign-in issues an HS256 JWT carrying `sub` (user id), `org` (organization id),
`role`, and `exp`. `core/security.py` issues and verifies it; every failure
(bad signature, `alg: none`, expired, missing claim, unknown role) is the same
401, so a caller cannot tell them apart.

`core/modules/loading.py` mounts each addon's `router` at `/api/<addon>` behind
`get_tenant_context`, so a tenant route cannot be written outside it. Routes that
run before a tenant exists (sign in, create an organization) go on the addon's
`public_router` instead.

Every tenant route also declares an `RBACGuard` from its addon's
`permissions.py`, matching its row in `security/access.md`. The six roles are in
`core/roles.py`. `RBACGuard.any_role()` is the pass-through guard for a route
whose matrix row is not settled yet. `tests/architecture/test_routes.py` fails the
build for a route with no guard, or any `/api` path that answers a request with
no token with anything but 401.

Cross-addon calls go through the contracts in `core/contracts/`. The owning addon
binds its implementation with `bind(Contract, factory)`, and a route receives it
with `Depends(provide(Contract))`, built around the same tenant-bound session as
the rest of the request.

`get_tenant_session` owns the request's single transaction. It commits when the
route returns and rolls back when anything raises, so a sales confirmation that
reserves stock and then fails writes nothing. Contract implementations flush and
never commit.

Each operational contract has a read-only `*Reader` facet (`SalesReader`,
`InventoryReader`, `ProcurementReader`, `AccountingReader`). `ai` and `home` may
use only readers, never a writer or `provide()`, and
`tests/architecture/test_contracts.py` enforces it. AI tools are registered as
factories and built around the request's bound session, so a tool cannot open an
unscoped session of its own.

Outside `ENVIRONMENT=local`, the app refuses to start with a JWT secret shorter
than 32 bytes or with the public default.

## Background Jobs

## Frontend

Vite, React 19, TypeScript, Tailwind v4, and React Router 7, tested with Vitest.
The layout mirrors the backend: `frontend/src/core/` is the framework half and
`frontend/src/addons/<name>/` holds each addon's screens, components, and
fixtures.

Each addon declares a `manifest.ts` with its `depends`, its screens, and an
optional `nav` entry. `core/app/registry.ts` reads the manifests to build the
module rail, so adding a module does not mean editing a hand-written list.
`core/app/addonDeps.test.ts` holds the frontend to the same import rule as the
backend and rejects cycles.

Contributions that cross addons go through core, as on the backend. The S-05
forecast overlay belongs to `forecasting`, which registers it in
`core/app/overlays.ts`; the inventory screen asks core for it by screen id rather
than importing `forecasting`.

Charts go through `core/components/charts`. Addons may not import Recharts
directly, and ESLint blocks a second y axis inside the chart layer.

Until the API exists, screens render from each addon's `fixtures/`, which are
shaped as the endpoint response they stand in for. Controls that would write data
carry the `unwired` prop and render visibly inert.

## Deployment Topology

The AWS account, who can sign in to it, and where secrets live are covered in
[infra/aws-account-setup.md](infra/aws-account-setup.md). The first Terraform to
apply is `infra/terraform/bootstrap/`, which creates the state bucket and the
GitHub Actions role; the `modules/` directories are still stubs.

## Observability

## Security Considerations
