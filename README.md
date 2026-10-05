# Sector 7 AI

Sector 7 AI is a multi-tenant cloud ERP platform covering customers, catalog,
inventory, sales, procurement, accounting, and reporting. An isolated, read-only
AI layer sits alongside the deterministic ERP core to provide assistance and
forecasting without ever writing to operational records.

## Overview

The project is split into a frontend and a backend that share the same eight
addon names: `base`, `sales`, `inventory`, `procurement`, `accounting`, `ai`,
`forecasting`, and `home`. If you know which addon a feature belongs to, you know
where to look on both sides.

Where things stand today:

| Part | State |
| --- | --- |
| Frontend | Built. Every screen renders from fixture data, and CI lints, typechecks, tests and builds it. |
| Backend | Skeleton. The addon layout and manifests exist; the API and the architecture tests are not written yet. |
| Infra | Placeholder. `docker-compose.yml`, `Makefile`, and the Terraform files are not configured yet. |

Because there is no API yet, any button that would write data is rendered
visibly inert: dashed border, a leading ✕, and a "Not wired up yet" tooltip. When you build
the endpoint behind one, remove its `unwired` prop. A test checks every screen,
so forgetting fails the suite.

## Architecture

```
backend/app/
  core/            framework: manifest loading, dependency graph, registry, contracts
  addons/<name>/   business code, one folder per addon
backend/tests/     architecture tests (specified, not yet written)

frontend/src/
  core/            app shell, UI primitives, charts, lib, styles, test harness
  addons/<name>/   screens, components, fixtures, manifest.ts
  routes/          the route table
```

The rules that hold everywhere are in [`CLAUDE.md`](CLAUDE.md): money is
`Decimal`, every query is scoped by `organization_id`, totals are computed on the
server, and the AI layer is read-only. Read it before your first change.

The most important rule for finding your way around: **an addon may import only
from core and from the addons listed in its own manifest's `depends`.** On the
frontend, `src/core/app/addonDeps.test.ts` enforces this, so an undeclared import
fails CI; the backend counterpart is still to be written. If you need data from
another addon, go through `core` (the registry or the contracts), not a direct
import.

Further reading:

- [`docs/architecture.md`](docs/architecture.md): module boundaries, load order,
  and how the AI layer is isolated
- [`docs/requirements/traceability.md`](docs/requirements/traceability.md): which
  addon owns each requirement

## Prerequisites

- Node 24 and npm, for the frontend

The backend has no runnable setup yet; `pyproject.toml` is still a placeholder.

## Getting Started

```
cd frontend
npm ci
npm run dev
```

Open the URL Vite prints. The sign-in screen goes straight through; there is no
real authentication yet.

### Where to start

| You are working on | Start in |
| --- | --- |
| A screen | `frontend/src/addons/<name>/screens/` and its `fixtures/` |
| A shared UI component | `frontend/src/core/components/ui/` |
| A chart | `frontend/src/core/components/charts/` (addons may not import Recharts) |
| Navigation or the app shell | `frontend/src/core/app/` |
| A backend addon | `backend/app/addons/<name>/__manifest__.py`, then `router.py`, `service.py`, `repository.py` |

Fixtures in `frontend/src/addons/<name>/fixtures/` are shaped exactly like the
endpoint response they stand in for. When an endpoint lands, the fixture is the
contract to match.

## Running Tests

Frontend, from `frontend/`:

```
npm run lint
npm run typecheck
npm test
npm run build
```

These are the same four steps CI runs on every pull request that touches
`frontend/`. The backend has no tests to run yet.

## Team
