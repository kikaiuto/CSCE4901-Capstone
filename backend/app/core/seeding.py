"""Deterministic demo tenants and the idempotent row loader every seeder shares.

An addon's demo rows live in its own data/demo.py, named by the "seeds" entry of
its manifest (CLAUDE.md). That module exposes ``async def seed(session, tenant)``
and adds rows through the ORM only. scripts/seed.py runs the seeders in addon
load order on an unbound session, so the tenancy hooks do not apply and each
seeder sets organization_id itself.

Ids are uuid5 values derived from the tenant name, so re-running the seed finds
its own rows and the frontend can name a demo workspace by id.
"""

import uuid
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import Base

NAMESPACE = uuid.uuid5(uuid.NAMESPACE_URL, "https://sector7.example/demo-seed/v1")
DEMO_ORGANIZATIONS = ("Northstar Electronics Demo", "Cedar Retail Demo")


def demo_uuid(*parts: str) -> uuid.UUID:
    return uuid.uuid5(NAMESPACE, "/".join(parts))


@dataclass(frozen=True, slots=True)
class DemoTenant:
    name: str
    organization_id: uuid.UUID

    def uuid(self, *parts: str) -> uuid.UUID:
        return demo_uuid(self.name, *parts)


def demo_tenants() -> tuple[DemoTenant, ...]:
    return tuple(DemoTenant(name, demo_uuid("organization", name)) for name in DEMO_ORGANIZATIONS)


async def add_missing(
    session: AsyncSession, model: type[Base], rows: Iterable[Mapping[str, Any]]
) -> int:
    mapper = inspect(model)
    key = mapper.get_property_by_column(mapper.primary_key[0]).key
    added = 0
    for row in rows:
        if await session.get(model, row[key]) is None:
            session.add(model(**row))
            added += 1
    await session.flush()
    return added
