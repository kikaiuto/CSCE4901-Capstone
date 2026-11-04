"""The demo seed runs through each addon's data/demo.py and is idempotent."""

import uuid

from sqlalchemy import func, select

from app.addons.accounting.models import ChartOfAccounts
from app.addons.base.data.demo import DEMO_PASSWORD, demo_email
from app.addons.base.models import Organization, Role, User
from app.addons.inventory.models import Product
from app.addons.procurement.models import Supplier
from app.addons.sales.models import Customer
from app.core.modules.loading import import_seeds
from app.core.seeding import demo_tenants, seed_demo

NORTHSTAR = uuid.UUID("6fd03a14-80fd-5476-a84e-ae0c2c0c6e4d")
CEDAR = uuid.UUID("d3d1a2ca-f45e-5da5-8ef8-3486edc3fe4a")
EXPECTED = {"base": 26, "accounting": 16, "inventory": 28, "procurement": 6, "sales": 20}


async def test_demo_tenant_ids_are_pinned():
    assert [tenant.organization_id for tenant in demo_tenants()] == [NORTHSTAR, CEDAR]


async def test_every_seeding_addon_contributes_through_its_manifest():
    assert [addon for addon, _ in import_seeds()] == list(EXPECTED)


async def test_seed_fills_both_tenants_once(sessions):
    async with sessions() as session:
        assert await seed_demo(session, import_seeds()) == EXPECTED
    async with sessions() as session:
        assert await seed_demo(session, import_seeds()) == {addon: 0 for addon in EXPECTED}
    async with sessions() as session:
        for model, expected in (
            (Organization, 2),
            (Role, 12),
            (User, 12),
            (ChartOfAccounts, 16),
            (Product, 24),
            (Supplier, 6),
            (Customer, 20),
        ):
            assert await session.scalar(select(func.count()).select_from(model)) == expected
        product = await session.scalar(
            select(Product).where(Product.organization_id == NORTHSTAR, Product.sku == "LAP-01")
        )
        asset = await session.get(ChartOfAccounts, product.asset_account_id)
        assert (asset.organization_id, asset.account_code) == (NORTHSTAR, "1200")


async def test_seed_keeps_rows_that_exist_under_another_id(sessions):
    async with sessions() as session:
        session.add(Organization(organization_id=NORTHSTAR, name="Northstar Electronics Demo"))
        session.add(Role(organization_id=NORTHSTAR, name="Owner"))
        await session.commit()
    async with sessions() as session:
        added = await seed_demo(session, import_seeds())
    assert added["base"] == EXPECTED["base"] - 2
    async with sessions() as session:
        owners = list(
            await session.scalars(
                select(Role).where(Role.organization_id == NORTHSTAR, Role.name == "Owner")
            )
        )
        assert len(owners) == 1
        owner_user = await session.scalar(
            select(User).where(
                User.organization_id == NORTHSTAR, User.email == "owner@northstar.demo"
            )
        )
        assert owner_user.role_id == owners[0].role_id


async def test_demo_users_share_one_hash_and_cover_every_role(sessions):
    async with sessions() as session:
        await seed_demo(session, import_seeds())
    async with sessions() as session:
        same_tenant = User.organization_id == Role.organization_id
        same_role = User.role_id == Role.role_id
        rows = (
            await session.execute(
                select(User.email, User.password_hash, Role.name)
                .join(Role, same_tenant & same_role)
                .where(User.organization_id == NORTHSTAR)
            )
        ).all()
    assert sorted(role for _, _, role in rows) == sorted(
        ["Accounting", "Admin", "Inventory", "Owner", "Purchasing", "Sales"]
    )
    assert len({password_hash for _, password_hash, _ in rows}) == 1
    assert {email for email, _, _ in rows} == {
        f"{role.lower()}@northstar.demo"
        for role in ("Accounting", "Admin", "Inventory", "Owner", "Purchasing", "Sales")
    }


async def test_seeded_demo_user_can_sign_in(sessions, client):
    async with sessions() as session:
        await seed_demo(session, import_seeds())
    northstar, _ = demo_tenants()
    response = await client.post(
        "/api/base/auth/login",
        json={
            "organization_id": str(NORTHSTAR),
            "email": demo_email(northstar, "Owner"),
            "password": DEMO_PASSWORD,
        },
    )
    assert response.status_code == 200, response.text
    me = await client.get(
        "/api/base/auth/me",
        headers={"Authorization": f"Bearer {response.json()['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["role"] == "owner"
    assert me.json()["full_name"] == "Dana Owens"
    assert me.json()["organization_name"] == "Northstar Electronics Demo"
