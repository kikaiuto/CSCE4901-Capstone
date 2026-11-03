# Sprint 1 foundation integration

This work combines the database foundation branch with the shared tenant and
contract code saved on the foundation backup branch. The original database
migration and table names are retained. The frontend is unchanged and still
uses fixtures.

## What is implemented

| Endpoint | Access | Behavior |
| --- | --- | --- |
| `POST /api/base/auth/login` | Public | Validates an organization UUID, email, and password; returns an access token. |
| `GET /api/base/auth/me` | Any authenticated role | Returns the current user's identity, full name, and active flag. |
| `GET /api/base/users` | Owner, Admin | Lists users in the caller's organization with the full name and active flag S-09 shows. |
| `GET /api/inventory/products` | Owner, Admin, Sales, Inventory, Purchasing | Returns the caller's products, with bounded pagination. |
| `GET /api/inventory/products/{product_id}` | Same product-read roles | Returns a product, or 404 for a missing or foreign-tenant UUID. |
| `GET /health` | Public | Checks PostgreSQL and Redis connectivity. |

## How a request moves through the code

For a product request, the order is:

1. `core/modules/loading.py` discovers manifests and mounts routers in dependency
   order. Every tenant router receives `get_tenant_session`; only an explicit
   `public_router` bypasses it.
2. `core/security.py` verifies the bearer token's signature, issuer, audience,
   time claims, UUIDs, and role.
3. `core/tenancy.py` binds the request's SQLAlchemy session to the organization
   in that token. A query parameter cannot select another organization.
4. The base addon's `check_identity` looks up the account and its current role.
   An inactive or deleted account is rejected, as is a token with an old role.
   The row it loaded stays on the session, so `/auth/me` answers without a
   second user query.
5. `READ_PRODUCTS` in the inventory permissions file checks the user's role.
6. The inventory router calls its service, which calls its repository.
7. ORM hooks add the tenant condition before SQL is executed. The response
   schema serializes the product; a foreign product is indistinguishable from
   a nonexistent one.
8. The request transaction commits on success and rolls back on failure.

The identity lookup is registered by the base addon when its router loads.
This keeps `core` independent of business addons while still checking accounts
in the database on every request. It is a startup registration, not an API a
client can call.

## Database decisions

The database branch uses plural table names and explicit UUID keys such as
`product_id` and `user_id`. The backup used a different naming convention. The
integration adapts the tenant hooks to mapped primary keys rather than creating
a second set of tables.

Every organization-owned model now inherits `TenantScoped`. Organization itself
inherits `TenantRoot`. The mixin declares `organization_id` once, with its
foreign key and index, so no model repeats the column. Reads, ORM updates, and
ORM deletes receive the tenant condition automatically. Flush checks also
reject:

- A new row explicitly assigned to another organization.
- A changed or deleted row whose real primary key belongs to another tenant.
- A foreign key that points at another tenant's record.
- A change to `organization_id` through a bulk update.
- Unsupported bulk APIs that skip normal ORM checks.

The database's composite foreign keys remain a second check on related records.
Raw SQL and Table-level statements do not go through these ORM checks; addon
architecture tests prohibit the relevant access forms. Bootstrap and migration
scripts run outside the request boundary.

The original migration, `eb867def2d3c`, is unchanged in behavior; its Python was
formatted for the existing lint rules. The new `9f3c2a1b7d60` revision:

- Adds `users.full_name` and `users.is_active`, with defaults for existing rows.
- Adds an organization index to each tenant-owned table.
- Widens journal debit and credit amounts to `NUMERIC(15,2)`.

Unit costs remain `NUMERIC(12,4)`. No second initial migration is introduced.
Downgrading the precision can fail if a newer amount exceeds the old range;
PostgreSQL raises an error instead of truncating it.

Two later revisions complete the schema the contracts assume. `4b1d7e9a2c30`
adds `inventory_ledger.unit_cost` and `purchase_order_lines.quantity_received`,
and `7c5e1a9b3d42` drops `ix_inventory_ledger_organization_id`, whose column
already leads `ix_inventory_ledger_product_time`. The ledger model is the one
place `organization_id` is redeclared, to leave that single-column index off.

Roles remain database rows because that is what the existing schema and seed
code use. `core/roles.py` supplies the six application roles. It accepts the
existing title-cased names and translates `Warehouse` to `inventory`. New seed
data contains all six standard roles, including Purchasing. A `roles` row with
a name outside the six is a data problem, not an authentication failure: the
user listing and the identity contract leave that user out and log a warning,
while a login or token check for that user's own account still fails closed.

## Demo seed

Each addon owns its demo rows in `data/demo.py`, the module its manifest names
under `seeds`; an addon with nothing to seed yet declares an empty list, and a
declared module without a `seed()` fails loading rather than being skipped.
That module exposes `seed(session, tenant)` and adds rows through the ORM with
`core/seeding.py`'s `add_missing`, which skips a row whose primary key or any
unique key already exists in that organization, so a second run adds nothing
and a row created another way under a different id is left alone.
`scripts/seed.py` is only the runner: it refuses any database that is not the
local `sector7` PostgreSQL, reading `ENVIRONMENT` through `get_settings()`,
then hands the seeders to `seed_demo`, which runs them in addon load order
inside one transaction.

```powershell
uv run python -m scripts.seed
```

Ids are uuid5 values derived from the tenant name, so the two demo
organizations keep stable ids that the sign-in wiring branch's workspace
picker can list. The
accounting seed runs before inventory in load order, which is what lets a
product's asset and revenue accounts point at the `1200` and `4000` rows by the
same derived id. Users are still not seeded; they wait for the
user-administration service so their password hashes are made the same way as
real accounts.

## Authentication and permissions

Passwords are hashed with Argon2id using memory cost 65536, time cost 3, and
parallelism 4. The stored hash contains the salt and parameters; the plaintext
password is not stored or returned.

Tokens use HS256 and include `sub`, `org`, `role`, `iss`, `aud`, `iat`, `nbf`, and
`exp`. The organization comes from the signed token, not from model output or
request parameters. Expired, malformed, unsigned, or incorrectly signed tokens
receive 401. Insufficient role access receives 403.

Signing requires at least 32 bytes of secret material. Docker's public fallback
is local-only; non-local settings reject it. Deployment must provide a separate
secret. Login failures use the same message for unknown users, invalid
passwords, inactive accounts, and mismatched organizations, and they take the
same time: when no usable account matches, the submitted password is verified
against a decoy Argon2 hash, so response timing does not reveal which emails
exist. Verification runs in a worker thread rather than on the event loop.

The current login contract still includes `organization_id` because emails are
unique per organization in the existing database. On this branch the sign-in
screen still signs in with a fixture; the separate sign-in wiring branch
resolves the organization with a workspace picker that lists the seeded demo
organizations by id. Email-only sign-in would need a deliberate change to
email uniqueness.

## Shared contracts and transactions

The seven files under `core/contracts/` define identity, sales, inventory,
procurement, accounting, forecasting, and assistant interfaces. Protocols
describe required methods; frozen dataclasses describe the values passed
between modules. They do not implement the remaining business workflows.

The base addon binds `IdentityContract` to `IdentityService`. Other modules can
request it through `Depends(provide(IdentityContract))` without importing the
base service implementation. Future implementations use the same pattern.

`provide()` uses the request's tenant-bound session. A sales service and an
inventory service called during one request therefore share one transaction.
Services flush when needed but leave commit and rollback to
`get_tenant_session`. The transaction tests check both success and a failure
after a write has already flushed.

Sales, inventory, procurement, and accounting expose separate reader protocols.
Architecture tests prevent AI and Home from importing the writer contracts or
their service factories. The actual AI provider and tool dispatcher remain
separate Sprint 1 work.

## Verification

From `backend/`, with dependencies installed:

```powershell
uv sync --frozen
uv run ruff check .
uv run python -m compileall -q app tests
uv run pytest
```

The default tests use a separate in-memory SQLite database for each test. The
fixtures create two organizations with all six roles, actual password hashes,
accounts, categories, and products. HTTP tests exercise the real FastAPI routes.

Tests live with what they cover. Route, service, and isolation tests for an
addon are in that addon's `tests/` folder, which reuses the fixtures from
`backend/tests/conftest.py`. `backend/tests/` keeps what belongs to core: the
architecture rules, the tenancy ORM hooks, the request transaction, the seed
runner, and the unit tests for config, errors, modules, and security.

To test against PostgreSQL, set `SECTOR7_TEST_DATABASE_URL` to a disposable
PostgreSQL database ending in `_test`. The fixtures clear its application tables
between tests. Never point it at a development database containing work to keep.

```powershell
$env:SECTOR7_TEST_DATABASE_URL = 'postgresql+asyncpg://user:password@localhost:5432/sector7_test'
uv run pytest
```

For migration validation, set `DATABASE_URL` to that disposable database:

```powershell
uv run alembic upgrade head
uv run alembic check
uv run alembic downgrade base
uv run alembic upgrade head
```

GitHub Actions is configured to perform that migration cycle and run tests on
PostgreSQL 17, followed by SQLite. Locally, the integration was also exercised
against an isolated PostgreSQL 18 instance using the installed binaries.

Coverage includes token validation, actual password verification, current-user
checks, role enforcement, cross-tenant product and user access, cross-tenant
writes and references, forged detached ORM objects, and request rollback.

Local validation for this change: 155 tests passed on SQLite and the same 155
passed on the compose PostgreSQL 17. Ruff, migration upgrade/downgrade, and the
Alembic schema comparison passed, and the seeder ran twice against the compose
database, adding every row the first time and none the second.

## What remains outside this change

- Sign-in UI integration, organization creation, refresh tokens, and user-administration writes.
- Customer and product creation, stock movement services, reservations, and row locking.
- Journal posting, balance enforcement across journal lines, and moving-average calculations.
- LLM provider integration, a working read-only tool registry, and forecasting.
- Demo users, posted transactions, stock history, and 90 days of sales history in the per-addon seeds.

The presence of a model, protocol, or fixture does not mark those workflows complete.
