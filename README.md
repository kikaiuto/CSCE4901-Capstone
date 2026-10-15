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
| Backend | Skeleton. The addon layout and manifests exist, and the app boots with a `/health` route; the API and the architecture tests are not written yet. |
| Infra | Local stack runs under `docker-compose.yml` with `make up`. The Terraform modules are still stubs; see [`docs/infra/aws-account-setup.md`](docs/infra/aws-account-setup.md) for the AWS plan. |

Because there is no API yet, any button that would write data is rendered
visibly inert: dashed border, a leading ✕, and a "Not wired up yet" tooltip. When you build
the endpoint behind one, remove its `unwired` prop. A test checks every screen,
so forgetting fails the suite.

## Architecture

```
backend/app/
  core/            framework: manifest loading, dependency graph, registry, contracts
  addons/<name>/   business code, one folder per addon
backend/tests/     architecture tests (the import check is written, the manifest check is not)

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
frontend, `src/core/app/addonDeps.test.ts` enforces this, and on the backend
`tests/architecture/test_addon_deps.py` does, so an undeclared import fails CI on
either side. If you need data from
another addon, go through `core` (the registry or the contracts), not a direct
import.

Further reading:

- [`docs/architecture.md`](docs/architecture.md): module boundaries, load order,
  and how the AI layer is isolated
- [`docs/requirements/traceability.md`](docs/requirements/traceability.md): which
  addon owns each requirement

## Prerequisites

- Docker Desktop, for the full stack
- Node 24 and npm, if you want to run the frontend outside Docker

## Getting Started

The whole stack runs in Docker: PostgreSQL, Redis, the FastAPI backend, the
Celery worker, and the Vite dev server.

```
cp .env.example .env
make up
```

| Service | URL |
| --- | --- |
| Frontend | <http://localhost:5173> |
| Backend health | <http://localhost:8000/health> |
| API docs | <http://localhost:8000/docs> |

Both the backend and the frontend bind-mount the source tree, so edits reload
without a rebuild. `make logs` tails everything, `make down` stops it, and
`make clean` also drops the database volume. `make test` and `make lint` run
both suites inside the containers.

The sign-in screen goes straight through; there is no real authentication yet.
Migrations run automatically on `make up`; `make revision m="add products"`
generates a new one once there are models to migrate.

To run only the frontend without Docker:

```
cd frontend
npm ci
npm run dev
```

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
`frontend/`.

Backend: `make test` runs pytest in the backend container, and CI runs it on every
pull request that touches `backend/`. A run that finds no tests fails rather than
passing.

## Team
