"""Idempotent, local-only demo seed for Sector 7 ERP.

Run from the backend container:
    uv run python -m scripts.seed

Each addon owns its demo rows in data/demo.py, the "seeds" entry of its
manifest. This script only checks that the target is the local database and
hands the seeders to core.seeding.seed_demo, which runs them in addon load
order inside one transaction.

It seeds reference data, business-master data, and one demo user per role.
Fulfilled sales, posted journals, and inventory movements wait for the
transaction-safe business services.
"""

import asyncio

from sqlalchemy.engine import make_url

from app.addons.base.data.demo import DEMO_PASSWORD, DEMO_USERS, demo_email
from app.core.config import get_settings
from app.core.db import get_engine, get_session_factory
from app.core.modules.loading import import_models, import_seeds
from app.core.seeding import demo_tenants, seed_demo

LOCAL_HOSTS = frozenset({"postgres", "localhost", "127.0.0.1"})


def validate_local_database() -> None:
    settings = get_settings()
    url = make_url(settings.database_url)
    if (
        settings.environment.lower() != "local"
        or url.database != "sector7"
        or url.host not in LOCAL_HOSTS
        or not url.drivername.startswith("postgresql+")
    ):
        raise RuntimeError(
            "Refusing to seed: expected local PostgreSQL 'sector7' database. "
            "Never run this demo seeder against staging, production, or sector7_test."
        )


async def main() -> None:
    validate_local_database()
    import_models()
    async with get_session_factory()() as session:
        added = await seed_demo(session, import_seeds())
    await get_engine().dispose()
    for addon, count in added.items():
        print(f"  {addon}: {count} new row(s)")
    print(f"Demo users share the password {DEMO_PASSWORD!r}:")
    for tenant in demo_tenants():
        print(f"{tenant.name}: {tenant.organization_id}")
        for role, _ in DEMO_USERS:
            print(f"  {role:<11} {demo_email(tenant, role)}")
    print("No journal postings, inventory movements, or sales history were created.")


if __name__ == "__main__":
    asyncio.run(main())
