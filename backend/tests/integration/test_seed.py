"""The demo seed runs through each addon's data/demo.py and is idempotent."""

import uuid

from sqlalchemy import func, select

from app.addons.accounting.models import ChartOfAccounts
from app.addons.base.models import Organization, Role
from app.addons.inventory.models import Product
from app.addons.procurement.models import Supplier
from app.addons.sales.models import Customer
from app.core.modules.loading import import_seeds
from app.core.seeding import demo_tenants, seed_demo

NORTHSTAR = uuid.UUID("6fd03a14-80fd-5476-a84e-ae0c2c0c6e4d")
CEDAR = uuid.UUID("d3d1a2ca-f45e-5da5-8ef8-3486edc3fe4a")
EXPECTED = {"base": 14, "accounting": 20, "inventory": 28, "procurement": 6, "sales": 20}


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
            (ChartOfAccounts, 20),
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
        owners = await session.scalars(
            select(Role).where(Role.organization_id == NORTHSTAR, Role.name == "Owner")
        )
        assert len(list(owners)) == 1
