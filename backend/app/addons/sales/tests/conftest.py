"""The shared two-tenant database and client, plus fake inventory and accounting
bindings.

The fakes stand in for InventoryContract and AccountingContract until the
inventory and posting PRs bind the real ones. They are installed on a copy of
the binding table, so nothing leaks between tests. A test that does not request
`fakes` runs against whatever is really bound, so once both PRs land, dropping
`fakes` from a test is all it takes to run it end to end.
"""

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from decimal import Decimal

import pytest

from app.core import contracts
from app.core.contracts.accounting import AccountingContract, EntrySource, PostedEntry
from app.core.contracts.inventory import (
    InsufficientStock,
    InventoryContract,
    LedgerRow,
    Shortage,
)
from tests.conftest import client, password_hash, sessions, tenants  # noqa: F401

SHIP_COST = Decimal("9.8765")


@dataclass
class FakeInventory:
    """Records calls. Set `short` to make reserve refuse, as the real one does."""

    calls: list[tuple] = field(default_factory=list)
    reserved: dict[uuid.UUID, list] = field(default_factory=dict)
    short: bool = False

    async def reserve(self, ctx, document, lines):
        self.calls.append(("reserve", document, tuple(lines)))
        if self.short:
            raise InsufficientStock([Shortage(x.product_id, x.quantity, 0) for x in lines])
        self.reserved[document.id] = list(lines)

    async def release(self, ctx, document):
        self.calls.append(("release", document))
        self.reserved.pop(document.id, None)

    async def ship(self, ctx, document):
        self.calls.append(("ship", document))
        return [
            LedgerRow(
                uuid.uuid4(),
                x.product_id,
                -x.quantity,
                0,
                SHIP_COST,
                document.number,
                ctx.user_id,
                datetime.now(UTC),
            )
            for x in self.reserved.pop(document.id)
        ]


@dataclass
class FakeAccounting:
    sales: list = field(default_factory=list)

    async def post_sale(self, ctx, sale):
        self.sales.append(sale)
        return PostedEntry(
            uuid.uuid4(), datetime.now(UTC).date(), EntrySource.AUTO, sale.document, ()
        )


@dataclass
class Fakes:
    inventory: FakeInventory
    accounting: FakeAccounting


@pytest.fixture(autouse=True)
def real_contracts(monkeypatch):
    """A private copy of the binding table for this test."""
    monkeypatch.setattr(contracts, "_factories", contracts._factories.copy())


@pytest.fixture
def fakes(real_contracts, monkeypatch):
    found = Fakes(FakeInventory(), FakeAccounting())
    monkeypatch.setitem(contracts._factories, InventoryContract, lambda _s: found.inventory)
    monkeypatch.setitem(contracts._factories, AccountingContract, lambda _s: found.accounting)
    return found
