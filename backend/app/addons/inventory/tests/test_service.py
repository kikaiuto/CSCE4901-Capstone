"""Service-layer tests for the inventory addon.

Features: F4, F5, F6, F9, F19. Requirements: R7, R8, R9, R10, R11, R12, R31."""

import asyncio
import os
import uuid
from decimal import Decimal

import pytest
from sqlalchemy import event, func, select
from sqlalchemy.engine import make_url

from app.addons.inventory.models import InventoryLedger, Product, StockReservation
from app.addons.inventory.service import InventoryService, moving_average_cost
from app.core.contracts.common import DocumentKind, DocumentRef
from app.core.contracts.inventory import (
    AdjustmentLine,
    InsufficientStock,
    ReceivedLine,
    Shortage,
    StockLine,
)
from app.core.errors import AppError, Conflict, NotFound
from app.core.roles import Role
from app.core.tenancy import TenantContext, bind_session


def ctx_for(tenant):
    return TenantContext(tenant.organization_id, tenant.users[Role.OWNER], Role.OWNER)


def doc(kind=DocumentKind.SALES_ORDER, number="SO-1001"):
    return DocumentRef(kind, uuid.uuid4(), number)


PO = DocumentKind.PURCHASE_ORDER


@pytest.fixture
async def inventory(sessions, tenants):
    first, _ = tenants
    async with sessions() as session:
        bind_session(session, first.organization_id)
        yield InventoryService(session), ctx_for(first), first


async def add_product(session, tenant, sku="W-02"):
    product = Product(
        organization_id=tenant.organization_id,
        category_id=tenant.category_id,
        asset_account_id=tenant.asset_id,
        revenue_account_id=tenant.revenue_id,
        name=sku,
        sku=sku,
        unit_cost=Decimal("5.0000"),
        average_cost=Decimal("5.0000"),
        unit_price=Decimal("9.0000"),
    )
    session.add(product)
    await session.flush()
    return product.product_id


async def count(session, model):
    return await session.scalar(select(func.count()).select_from(model))


async def test_receive_moves_the_moving_average(inventory):
    service, ctx, tenant = inventory
    product = tenant.product_id

    # Worked example, starting from 0 on hand at 10.0000:
    #   receive 10 @ 10.0000 -> (0*10 + 10*10) / 10           = 10.0000
    #   receive  5 @ 13.0000 -> (10*10 + 5*13) / 15 = 165 / 15 = 11.0000
    #   receive  3 @ 12.3456 -> (15*11 + 3*12.3456) / 18
    #                         = 202.0368 / 18 = 11.22426... -> 11.2243
    expected = [
        (10, "10.0000", 10, "10.0000"),
        (5, "13.0000", 15, "11.0000"),
        (3, "12.3456", 18, "11.2243"),
    ]
    for quantity, cost, on_hand, average in expected:
        preview = await service.preview_average_cost(ctx, product, quantity, Decimal(cost))
        (row,) = await service.receive(
            ctx, doc(PO, "PO-0001"), [ReceivedLine(product, quantity, Decimal(cost))]
        )
        assert preview == row.unit_cost == Decimal(average)
        assert row.change_quantity == quantity
        assert row.resulting_on_hand == on_hand
        assert row.reference_document == "PO-0001"
        assert row.user_id == ctx.user_id

    stock = (await service.get_stock(ctx, [product]))[product]
    assert (stock.on_hand, stock.committed, stock.available) == (18, 0, 18)
    assert stock.moving_average_cost == Decimal("11.2243")
    ledger = await service.get_ledger(ctx, product)
    assert [row.resulting_on_hand for row in ledger] == [18, 15, 10]


def test_average_cost_rounds_half_up_to_four_places():
    # (1 * 0.0001 + 1 * 0) / 2 = 0.00005: half-up gives 0.0001, half-even would give 0.
    assert moving_average_cost(1, Decimal("0.0001"), 1, Decimal("0")) == Decimal("0.0001")
    assert moving_average_cost(0, Decimal("99"), 4, Decimal("2.5")) == Decimal("2.5000")


async def test_ledger_is_append_only(sessions, inventory):
    service, ctx, tenant = inventory
    product = tenant.product_id
    statements = []
    engine = sessions.kw["bind"].sync_engine

    def capture(_conn, _cursor, statement, *_args):
        statements.append(statement.upper())

    event.listen(engine, "before_cursor_execute", capture)
    try:
        await service.receive(ctx, doc(PO), [ReceivedLine(product, 10, Decimal("10"))])
        first = await service.get_ledger(ctx, product)
        order = doc()
        await service.reserve(ctx, order, [StockLine(product, 4)])
        await service.ship(ctx, order)
        await service.adjust(
            ctx, doc(DocumentKind.ADJUSTMENT, "ADJ-1"), "cycle count", [AdjustmentLine(product, -1)]
        )
        released = doc()
        await service.reserve(ctx, released, [StockLine(product, 2)])
        await service.release(ctx, released)
    finally:
        event.remove(engine, "before_cursor_execute", capture)

    ledger = await service.get_ledger(ctx, product)
    assert [row.change_quantity for row in ledger] == [-1, -4, 10]
    assert [row.resulting_on_hand for row in ledger] == [5, 6, 10]
    assert ledger[-1] == first[0]
    for table in ("INVENTORY_LEDGER", "STOCK_RESERVATIONS"):
        assert not [s for s in statements if s.startswith(("UPDATE " + table, "DELETE"))]


async def test_reserve_refuses_a_short_line_and_writes_nothing(inventory):
    service, ctx, tenant = inventory
    plenty, scarce = tenant.product_id, await add_product(service.session, tenant)
    await service.receive(
        ctx,
        doc(PO),
        [ReceivedLine(plenty, 10, Decimal("10")), ReceivedLine(scarce, 2, Decimal("5"))],
    )

    with pytest.raises(InsufficientStock) as raised:
        await service.reserve(ctx, doc(), [StockLine(plenty, 3), StockLine(scarce, 5)])

    assert raised.value.shortages == (Shortage(scarce, 5, 2),)
    assert await count(service.session, StockReservation) == 0
    stock = await service.get_stock(ctx, [plenty, scarce])
    assert stock[plenty].committed == stock[scarce].committed == 0


async def test_release_frees_the_reservation(inventory):
    service, ctx, tenant = inventory
    product = tenant.product_id
    await service.receive(ctx, doc(PO), [ReceivedLine(product, 10, Decimal("10"))])
    order = doc()

    await service.reserve(ctx, order, [StockLine(product, 4)])
    stock = (await service.get_stock(ctx, [product]))[product]
    assert (stock.on_hand, stock.committed, stock.available) == (10, 4, 6)
    with pytest.raises(Conflict):
        await service.reserve(ctx, order, [StockLine(product, 1)])

    await service.release(ctx, order)
    await service.release(ctx, order)  # twice is a no-op
    stock = (await service.get_stock(ctx, [product]))[product]
    assert (stock.on_hand, stock.committed, stock.available) == (10, 0, 10)
    assert await count(service.session, InventoryLedger) == 1
    with pytest.raises(NotFound):
        await service.release(ctx, doc())


async def test_ship_writes_rows_at_the_moving_average(inventory):
    service, ctx, tenant = inventory
    product = tenant.product_id
    await service.receive(
        ctx,
        doc(PO),
        [ReceivedLine(product, 10, Decimal("10")), ReceivedLine(product, 5, Decimal("13"))],
    )
    order = doc(number="SO-1044")
    await service.reserve(ctx, order, [StockLine(product, 4), StockLine(product, 2)])

    (row,) = await service.ship(ctx, order)

    assert (row.change_quantity, row.resulting_on_hand) == (-6, 9)
    assert row.unit_cost == Decimal("11.0000")
    assert row.reference_document == "SO-1044"
    stock = (await service.get_stock(ctx, [product]))[product]
    assert (stock.on_hand, stock.committed, stock.available) == (9, 0, 9)
    with pytest.raises(Conflict):
        await service.ship(ctx, order)


async def test_adjust_needs_a_reason_and_cannot_take_committed_stock(inventory):
    service, ctx, tenant = inventory
    product = tenant.product_id
    await service.receive(ctx, doc(PO), [ReceivedLine(product, 5, Decimal("10"))])
    await service.reserve(ctx, doc(), [StockLine(product, 3)])
    adjustment = doc(DocumentKind.ADJUSTMENT, "ADJ-0042")

    with pytest.raises(AppError):
        await service.adjust(ctx, adjustment, "  ", [AdjustmentLine(product, 1)])
    with pytest.raises(InsufficientStock):
        await service.adjust(ctx, adjustment, "damaged", [AdjustmentLine(product, -3)])

    (row,) = await service.adjust(ctx, adjustment, "damaged", [AdjustmentLine(product, -2)])
    assert (row.change_quantity, row.resulting_on_hand) == (-2, 3)
    assert row.unit_cost == Decimal("10.0000")


async def test_other_tenant_products_are_refused(inventory, tenants):
    service, ctx, _ = inventory
    _, other = tenants
    foreign = other.product_id

    with pytest.raises(NotFound):
        await service.receive(ctx, doc(PO), [ReceivedLine(foreign, 1, Decimal("1"))])
    with pytest.raises(NotFound):
        await service.reserve(ctx, doc(), [StockLine(foreign, 1)])
    with pytest.raises(NotFound):
        await service.adjust(ctx, doc(), "count", [AdjustmentLine(foreign, 1)])
    with pytest.raises(NotFound):
        await service.preview_average_cost(ctx, foreign, 1, Decimal("1"))
    assert await service.get_stock(ctx, [foreign]) == {}
    assert await service.get_product_accounts(ctx, [foreign]) == {}
    assert await service.get_ledger(ctx, foreign) == []
    assert await count(service.session, InventoryLedger) == 0


IS_POSTGRES = (
    make_url(os.environ.get("SECTOR7_TEST_DATABASE_URL", "sqlite://")).get_backend_name()
    == "postgresql"
)


@pytest.mark.skipif(not IS_POSTGRES, reason="row locks need Postgres")
async def test_concurrent_reserve_waits_for_the_row_lock(sessions, tenants):
    first, _ = tenants
    ctx = ctx_for(first)
    product = first.product_id
    async with sessions() as holder, sessions() as waiter:
        bind_session(holder, first.organization_id)
        bind_session(waiter, first.organization_id)
        held, waiting = InventoryService(holder), InventoryService(waiter)
        await held.receive(ctx, doc(PO), [ReceivedLine(product, 5, Decimal("10"))])
        await holder.commit()

        await held.reserve(ctx, doc(), [StockLine(product, 5)])
        second = asyncio.create_task(waiting.reserve(ctx, doc(), [StockLine(product, 5)]))
        await asyncio.sleep(0.5)
        assert not second.done(), "the second reserve should block on FOR UPDATE"

        await holder.commit()
        with pytest.raises(InsufficientStock):
            await second
