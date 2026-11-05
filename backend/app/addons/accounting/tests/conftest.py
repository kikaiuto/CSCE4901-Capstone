"""Reuse the two-tenant database and client from backend/tests/conftest.py, plus a
fake InventoryContract and the accounts the automatic postings look up by code."""

from decimal import Decimal

import pytest

from app.addons.accounting.models import ChartOfAccounts
from app.core import contracts
from app.core.contracts.inventory import InventoryContract, ProductAccounts, StockLevel
from tests.conftest import client, password_hash, sessions, tenants  # noqa: F401

POSTING_ACCOUNTS = {
    "1100": ("Accounts Receivable", "Asset"),
    "2000": ("Accounts Payable", "Liability"),
    "2100": ("Sales Tax Payable", "Liability"),
    "5000": ("Cost of Goods Sold", "Expense"),
    "5100": ("Inventory Adjustment", "Expense"),
}


class FakeInventory:
    """Stands in for InventoryContract until the inventory addon binds its own.
    Knows each tenant's one product, starting at 0 on hand and 10.0000 cost."""

    def __init__(self, seeded) -> None:
        self.products = {
            t.organization_id: {
                t.product_id: ProductAccounts(t.product_id, t.asset_id, t.revenue_id)
            }
            for t in seeded
        }
        self.on_hand = {t.product_id: 0 for t in seeded}
        self.cost = {t.product_id: Decimal("10.0000") for t in seeded}
        self.receipts = []

    async def get_product_accounts(self, ctx, product_ids):
        mine = self.products[ctx.organization_id]
        return {p: mine[p] for p in product_ids if p in mine}

    async def get_stock(self, ctx, product_ids):
        return {
            p: StockLevel(p, self.on_hand[p], 0, self.on_hand[p], 0, self.cost[p])
            for p in await self.get_product_accounts(ctx, product_ids)
        }

    async def preview_average_cost(self, ctx, product_id, received_qty, unit_cost):
        on_hand, cost = self.on_hand[product_id], self.cost[product_id]
        total = on_hand * cost + received_qty * unit_cost
        return (total / (on_hand + received_qty)).quantize(Decimal("0.0001"))

    async def receive(self, ctx, document, lines):
        self.receipts.append((document, list(lines)))
        for x in lines:
            self.cost[x.product_id] = await self.preview_average_cost(
                ctx, x.product_id, x.quantity, x.unit_cost
            )
            self.on_hand[x.product_id] += x.quantity
        return []


@pytest.fixture
def inventory(tenants, monkeypatch):  # noqa: F811
    fake = FakeInventory(tenants)
    monkeypatch.setitem(contracts._factories, InventoryContract, lambda session: fake)
    return fake


async def add_accounts(sessions, tenant, codes=tuple(POSTING_ACCOUNTS)):  # noqa: F811
    """Adds posting accounts to a test tenant; returns {code: account_id}."""
    rows = {
        code: ChartOfAccounts(
            organization_id=tenant.organization_id,
            account_code=code,
            account_name=POSTING_ACCOUNTS[code][0],
            account_type=POSTING_ACCOUNTS[code][1],
        )
        for code in codes
    }
    async with sessions() as session:
        session.add_all(rows.values())
        await session.commit()
    return {code: row.account_id for code, row in rows.items()}
