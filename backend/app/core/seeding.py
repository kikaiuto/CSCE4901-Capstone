"""Deterministic demo tenants and the idempotent row loader every seeder shares.

An addon's demo rows live in its own data/demo.py, named by the "seeds" entry of
its manifest (CLAUDE.md). That module exposes ``async def seed(session, tenant)``
and adds rows through the ORM only. seed_demo runs the seeders in addon load
order on an unbound session, so the tenancy hooks do not apply and each seeder
sets organization_id itself.

Ids are uuid5 values derived from the tenant name, so re-running the seed finds
its own rows and the frontend can name a demo workspace by id.
"""

from collections.abc import Awaitable, Callable, Iterable, Mapping
from dataclasses import dataclass
from typing import Any
from uuid import NAMESPACE_URL, UUID, uuid5

from sqlalchemy import ColumnElement, Table, and_, inspect, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.schema import UniqueConstraint

from app.core.db import Base

NAMESPACE = uuid5(NAMESPACE_URL, "https://sector7.example/demo-seed/v1")
DEMO_ORGANIZATIONS = ("Northstar Electronics Demo", "Cedar Retail Demo")


def demo_uuid(*parts: str) -> UUID:
    return uuid5(NAMESPACE, "/".join(parts))


@dataclass(frozen=True, slots=True)
class DemoTenant:
    name: str
    organization_id: UUID

    def id_for(self, *parts: str) -> UUID:
        return demo_uuid(self.name, *parts)


Seeder = Callable[[AsyncSession, DemoTenant], Awaitable[int]]


def demo_tenants() -> tuple[DemoTenant, ...]:
    return tuple(DemoTenant(name, demo_uuid("organization", name)) for name in DEMO_ORGANIZATIONS)


def _already_present(table: Table, row: Mapping[str, Any]) -> ColumnElement[bool]:
    """True for a row holding this row's primary key or any of its unique keys,
    within the row's organization."""
    keys = [tuple(column.name for column in table.primary_key.columns)]
    keys += [
        tuple(column.name for column in constraint.columns)
        for constraint in table.constraints
        if isinstance(constraint, UniqueConstraint)
    ]
    matches = [
        and_(*(table.c[name] == row[name] for name in key))
        for key in keys
        if all(name in row for name in key)
    ]
    condition = or_(*matches)
    if "organization_id" in table.c:
        condition = and_(table.c.organization_id == row["organization_id"], condition)
    return condition


async def add_missing(
    session: AsyncSession, model: type[Base], rows: Iterable[Mapping[str, Any]]
) -> int:
    table = inspect(model).local_table
    added = 0
    for row in rows:
        found = await session.scalar(select(model).where(_already_present(table, row)).limit(1))
        if found is None:
            session.add(model(**row))
            added += 1
    await session.flush()
    return added


async def seed_demo(session: AsyncSession, seeders: Iterable[tuple[str, Seeder]]) -> dict[str, int]:
    """Run every seeder for every demo tenant in one transaction. Returns the
    rows each addon added."""
    seeders = list(seeders)
    added = {addon: 0 for addon, _ in seeders}
    for tenant in demo_tenants():
        for addon, seed in seeders:
            added[addon] += await seed(session, tenant)
    await session.commit()
    return added
