"""Isolated two-tenant database and an HTTP client for the real application."""

import os
import uuid
from dataclasses import dataclass
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

os.environ["JWT_SECRET"] = "test-only-secret-0123456789abcdef0123456789"

from app.addons.accounting.models import ChartOfAccounts  # noqa: E402
from app.addons.base.models import Organization, User  # noqa: E402
from app.addons.base.models import Role as UserRole
from app.addons.inventory.models import Product, ProductCategory  # noqa: E402
from app.core.db import Base, TenantSafeSession, get_session  # noqa: E402
from app.core.modules.loading import import_models  # noqa: E402
from app.core.roles import Role  # noqa: E402
from app.core.security import TokenClaims, hash_password, issue_access_token  # noqa: E402
from app.main import app  # noqa: E402

PASSWORD = "Capstone-test-password-21"


@dataclass(frozen=True)
class Tenant:
    organization_id: uuid.UUID
    users: dict[Role, uuid.UUID]
    roles: dict[Role, uuid.UUID]
    product_id: uuid.UUID
    category_id: uuid.UUID
    asset_id: uuid.UUID
    revenue_id: uuid.UUID
    owner_email: str

    def token(self, role: Role = Role.OWNER) -> str:
        return issue_access_token(TokenClaims(self.users[role], self.organization_id, role))

    def headers(self, role: Role = Role.OWNER) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token(role)}"}


@pytest.fixture(scope="session")
def password_hash():
    return hash_password(PASSWORD)


@pytest.fixture
async def sessions():
    import_models()
    database_url = os.environ.get("SECTOR7_TEST_DATABASE_URL", "sqlite+aiosqlite://")
    is_sqlite = make_url(database_url).get_backend_name() == "sqlite"
    if not is_sqlite and not (make_url(database_url).database or "").endswith("_test"):
        raise ValueError(
            "SECTOR7_TEST_DATABASE_URL must name a disposable database ending in _test"
        )
    engine = create_async_engine(database_url, **({"poolclass": StaticPool} if is_sqlite else {}))

    @event.listens_for(engine.sync_engine, "connect")
    def enable_foreign_keys(connection, _record):
        if not is_sqlite:
            return
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    try:
        yield async_sessionmaker(
            engine, expire_on_commit=False, sync_session_class=TenantSafeSession
        )
    finally:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
        await engine.dispose()


async def seed_tenant(session, name, password_hash):
    organization = Organization(name=name)
    session.add(organization)
    await session.flush()
    org_id = organization.organization_id
    role_rows = {role: UserRole(organization_id=org_id, name=role.value.title()) for role in Role}
    session.add_all(role_rows.values())
    await session.flush()
    users = {
        role: User(
            organization_id=org_id,
            role_id=row.role_id,
            email=f"{role.value}@{name.lower()}.test",
            password_hash=password_hash,
            full_name=f"{name} {role.value}",
        )
        for role, row in role_rows.items()
    }
    session.add_all(users.values())
    asset = ChartOfAccounts(
        organization_id=org_id,
        account_code="1200",
        account_name="Inventory",
        account_type="Asset",
    )
    revenue = ChartOfAccounts(
        organization_id=org_id,
        account_code="4000",
        account_name="Sales",
        account_type="Revenue",
    )
    category = ProductCategory(organization_id=org_id, name="Parts", hierarchy_level=0)
    session.add_all([asset, revenue, category])
    await session.flush()
    product = Product(
        organization_id=org_id,
        category_id=category.category_id,
        asset_account_id=asset.account_id,
        revenue_account_id=revenue.account_id,
        name=f"{name} Widget",
        sku="W-01",
        unit_cost=Decimal("10.0000"),
        average_cost=Decimal("10.0000"),
        unit_price=Decimal("15.0000"),
    )
    session.add(product)
    await session.flush()
    return Tenant(
        org_id,
        {role: user.user_id for role, user in users.items()},
        {role: row.role_id for role, row in role_rows.items()},
        product.product_id,
        category.category_id,
        asset.account_id,
        revenue.account_id,
        users[Role.OWNER].email,
    )


@pytest.fixture
async def tenants(sessions, password_hash):
    async with sessions() as session:
        first = await seed_tenant(session, "Acme", password_hash)
        second = await seed_tenant(session, "Northstar", password_hash)
        await session.commit()
    return first, second


@pytest.fixture
async def client(sessions):
    async def override_session():
        async with sessions() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            yield client
    finally:
        app.dependency_overrides.clear()
