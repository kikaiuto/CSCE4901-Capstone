"""The demo seed runs through each addon's data/demo.py and is idempotent."""

import uuid

from sqlalchemy import func, select

from app.addons.accounting.models import ChartOfAccounts
from app.addons.base.models import Organization, Role
from app.addons.inventory.models import Product
from app.addons.procurement.models import Supplier
from app.addons.sales.models import Customer
from app.core.modules.loading import import_seeds
from app.core.seeding import demo_tenants

NORTHSTAR = uuid.UUID("6fd03a14-80fd-5476-a84e-ae0c2c0c6e4d")
CEDAR = uuid.UUID("d3d1a2ca-f45e-5da5-8ef8-3486edc3fe4a")


async def run_seed(session) -> dict[str, int]:
    added: dict[str, int] = {}
    for tenant in demo_tenants():
        for addon, seed in import_seeds():
            added[addon] = added.get(addon, 0) + await seed(session, tenant)
    await session.commit()
    return added


async def test_seed_ids_match_the_frontend_demo_workspaces():
    assert [tenant.organization_id for tenant in demo_tenants()] == [NORTHSTAR, CEDAR]


async def test_every_seeding_addon_contributes_through_its_manifest():
    assert [addon for addon, _ in import_seeds()] == [
        "base",
        "accounting",
        "inventory",
        "procurement",
        "sales",
    ]


async def test_seed_fills_both_tenants_once(sessions):
    async with sessions() as session:
        first = await run_seed(session)
    async with sessions() as session:
        second = await run_seed(session)
    assert first == {"base": 14, "accounting": 16, "inventory": 28, "procurement": 6, "sales": 20}
    assert second == {addon: 0 for addon in first}
    async with sessions() as session:
        for model, expected in (
            (Organization, 2),
            (Role, 12),
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
