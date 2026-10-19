"""Shared fixtures: an in-memory database with two seeded tenants, and a client.

The tests run on SQLite so they need no Postgres. Tenant scoping is applied by
the ORM before SQL is emitted, so it behaves the same on both. Row locking
(SELECT ... FOR UPDATE) does not, and those tests will need Postgres.
"""

import os
import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Set before app.core.config caches settings. 32+ bytes, as RFC 7518 asks for HS256.
os.environ["JWT_SECRET"] = "test-only-secret-0123456789abcdef0123456789"

from app.addons.base.models import Organization, User  # noqa: E402
from app.core.db import Base, TenantSafeSession, get_session  # noqa: E402
from app.core.modules.loading import import_models  # noqa: E402
from app.core.roles import Role  # noqa: E402
from app.core.security import TokenClaims, issue_access_token  # noqa: E402


@dataclass(frozen=True)
class Tenant:
    organization_id: uuid.UUID
    owner_id: uuid.UUID
    sales_id: uuid.UUID

    def token(self, role: Role = Role.OWNER) -> str:
        user_id = self.owner_id if role is Role.OWNER else self.sales_id
        return issue_access_token(
            TokenClaims(user_id=user_id, organization_id=self.organization_id, role=role)
        )

    def headers(self, role: Role = Role.OWNER) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token(role)}"}


@pytest.fixture
async def sessions() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    import_models()
    engine = create_async_engine(
        "sqlite+aiosqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False}
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield async_sessionmaker(engine, expire_on_commit=False, sync_session_class=TenantSafeSession)
    await engine.dispose()


async def _seed_tenant(session: AsyncSession, name: str, slug: str) -> Tenant:
    org = Organization(name=name)
    session.add(org)
    await session.flush()
    owner = User(
        organization_id=org.id,
        email=f"owner@{slug}.test",
        full_name=f"{name} Owner",
        password_hash="not-a-real-hash",
        role=Role.OWNER,
    )
    sales = User(
        organization_id=org.id,
        email=f"sales@{slug}.test",
        full_name=f"{name} Sales",
        password_hash="not-a-real-hash",
        role=Role.SALES,
    )
    session.add_all([owner, sales])
    await session.flush()
    return Tenant(organization_id=org.id, owner_id=owner.id, sales_id=sales.id)


@pytest.fixture
async def tenants(sessions: async_sessionmaker[AsyncSession]) -> tuple[Tenant, Tenant]:
    async with sessions() as session:
        a = await _seed_tenant(session, "Acme Supply", "acme")
        b = await _seed_tenant(session, "Northstar Parts", "northstar")
        await session.commit()
    return a, b


@pytest.fixture
async def client(sessions: async_sessionmaker[AsyncSession]) -> AsyncIterator[AsyncClient]:
    from app.main import app

    async def override_session() -> AsyncIterator[AsyncSession]:
        async with sessions() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
