# Architecture

## Context

## System Overview

## Multi-Tenancy Model

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

## Observability

## Security Considerations
