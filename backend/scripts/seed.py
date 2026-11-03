"""Idempotent, local-only demo seed for Sector 7 ERP.

Run from the backend container:
    uv run python -m scripts.seed

Each addon owns its demo rows in data/demo.py, the "seeds" entry of its
manifest. This script only checks that the target is the local database and
runs those seeders in addon load order inside one transaction.

It seeds reference and business-master data, NOT users, fulfilled sales,
posted journals, or inventory movements. Those need the authenticated and
transaction-safe business services before reliable historical seeding.
"""

import asyncio

from sqlalchemy.engine import make_url

from app.core.config import get_settings
from app.core.db import get_engine, get_session_factory
from app.core.modules.loading import import_models, import_seeds
from app.core.seeding import demo_tenants

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
    seeders = import_seeds()
    async with get_session_factory()() as session:
        for tenant in demo_tenants():
            print(f"{tenant.name} ({tenant.organization_id})")
            for addon, seed in seeders:
                added = await seed(session, tenant)
                print(f"  {addon}: {added} new row(s)")
        await session.commit()
    await get_engine().dispose()
    print("No users, journal postings, inventory movements, or sales history were created.")


if __name__ == "__main__":
    asyncio.run(main())
