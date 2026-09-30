# Architecture

## Context

## System Overview

## Multi-Tenancy Model

## Module Boundaries

Business code lives in addons under `backend/app/addons/`. Framework code lives in
`backend/app/core/` and never imports an addon. There are eight addons, one per
branch of information architecture diagram D-03. See ADR 0001 for why.

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
rows for S-02, deterministic dashboard metrics, read-only AI tools, and sidebar
entries. This is why `home` can render a queue fed by four addons while
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

The frontend mirrors the backend addon names. `frontend/src/core/` is the
framework half — the app shell, the UI primitives, `lib/`, the design tokens, and
the test harness. `frontend/src/addons/<name>/` holds that addon's screens,
components, and fixtures.

Each addon carries a `manifest.ts` declaring its id, label, icon, track, screens,
nav placement, and the work queue groups it contributes to.

**Not built yet.** These manifests are declarations without a consumer. The module
list is still written out by hand in four places:

- the route table in `src/routes/index.tsx`
- the `OPERATIONS` array in `src/core/app/Sidebar.tsx`
- the icon keys in `src/core/components/ui/Icon.tsx`
- the `MODULES` line in `src/addons/base/screens/SignInScreen.tsx`

Folding those four into the manifests is the frontend half of the registry
described under Module Boundaries. Until it exists, adding an addon means five
edits, and the manifests can drift from what the app actually routes. Screens for
`inventory`, `procurement`, `accounting`, and `forecasting` do not exist yet;
those routes render `core/app/Placeholder` and their manifests declare the screen
IDs the wireframes specify.

## Deployment Topology

## Observability

## Security Considerations
