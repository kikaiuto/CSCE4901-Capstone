"""Service-layer tests for the sales addon: SalesService as SalesContract.

Features: F3, F6, F7. Requirements: R5, R6, R13, R14, R15."""

from decimal import Decimal
from itertools import product

import pytest

from app.addons.sales.models import Customer
from app.addons.sales.service import SalesService, document
from app.addons.sales.tests.conftest import SHIP_COST
from app.core.contracts.inventory import InsufficientStock
from app.core.contracts.sales import (
    ORDER_TRANSITIONS,
    InvalidTransition,
    OrderDraft,
    OrderLineDraft,
    OrderStatus,
    SalesContract,
)
from app.core.roles import Role
from app.core.tenancy import TenantContext, bind_session

S = OrderStatus
# The shortest path from DRAFT to each status.
PATH_TO = {
    S.DRAFT: [],
    S.CONFIRMED: [S.CONFIRMED],
    S.FULFILLED: [S.CONFIRMED, S.FULFILLED],
    S.CANCELLED: [S.CANCELLED],
}
ALLOWED = [(a, b) for a, targets in ORDER_TRANSITIONS.items() for b in targets]
REFUSED = [(a, b) for a, b in product(S, S) if b not in ORDER_TRANSITIONS[a]]


@pytest.fixture
async def acme(sessions, tenants):
    tenant, _ = tenants
    async with sessions() as session:
        bind_session(session, tenant.organization_id)
        customer = Customer(organization_id=tenant.organization_id, name="Buyer")
        session.add(customer)
        await session.flush()
        ctx = TenantContext(tenant.organization_id, tenant.users[Role.SALES], Role.SALES)
        yield SalesService(session), ctx, tenant, customer.customer_id


async def draft_order(sales, ctx, tenant, customer_id, quantity=3):
    # A client price of 999 is ignored: the catalog says 15.0000.
    line = OrderLineDraft(tenant.product_id, quantity, Decimal("999"))
    return await sales.create_order(ctx, OrderDraft(customer_id, [line]))


def test_service_satisfies_the_contract():
    assert isinstance(SalesService(None), SalesContract)


async def test_totals_are_computed_from_catalog_prices(acme):
    sales, ctx, tenant, customer_id = acme
    order = await draft_order(sales, ctx, tenant, customer_id)
    assert order.status is S.DRAFT
    assert [x.line_total for x in order.lines] == [Decimal("45.00")]
    # 45.00 + 8.25% tax (3.7125 -> 3.71)
    assert order.order_total == Decimal("48.71")
    assert (await sales.get_order(ctx, order.order_id)).order_total == Decimal("48.71")


@pytest.mark.parametrize(("start", "to"), ALLOWED)
async def test_allowed_transition(acme, fakes, start, to):
    sales, ctx, tenant, customer_id = acme
    order = await draft_order(sales, ctx, tenant, customer_id)
    for step in PATH_TO[start]:
        await sales.transition_order_status(ctx, order.order_id, step)
    moved = await sales.transition_order_status(ctx, order.order_id, to)
    assert moved.status is to
    assert (await sales.get_order(ctx, order.order_id)).status is to


@pytest.mark.parametrize(("start", "to"), REFUSED)
async def test_refused_transition_names_both_statuses(acme, fakes, start, to):
    sales, ctx, tenant, customer_id = acme
    order = await draft_order(sales, ctx, tenant, customer_id)
    for step in PATH_TO[start]:
        await sales.transition_order_status(ctx, order.order_id, step)
    calls_before = len(fakes.inventory.calls)
    with pytest.raises(InvalidTransition) as raised:
        await sales.transition_order_status(ctx, order.order_id, to)
    assert raised.value.details()["current"] == start.value
    assert raised.value.details()["requested"] == to.value
    assert (await sales.get_order(ctx, order.order_id)).status is start
    assert len(fakes.inventory.calls) == calls_before


async def test_side_effects_per_transition(acme, fakes):
    sales, ctx, tenant, customer_id = acme
    cancelled_draft = await draft_order(sales, ctx, tenant, customer_id)
    await sales.transition_order_status(ctx, cancelled_draft.order_id, S.CANCELLED)
    assert fakes.inventory.calls == []  # nothing was reserved

    order = await draft_order(sales, ctx, tenant, customer_id)
    doc = document(order.order_id)
    await sales.transition_order_status(ctx, order.order_id, S.CONFIRMED)
    await sales.transition_order_status(ctx, order.order_id, S.CANCELLED)
    assert [c[0] for c in fakes.inventory.calls] == ["reserve", "release"]
    assert fakes.inventory.calls[0][1] == doc
    assert [(x.product_id, x.quantity) for x in fakes.inventory.calls[0][2]] == [
        (tenant.product_id, 3)
    ]
    assert fakes.accounting.sales == []


async def test_insufficient_stock_leaves_the_order_in_draft(acme, fakes):
    sales, ctx, tenant, customer_id = acme
    order = await draft_order(sales, ctx, tenant, customer_id)
    fakes.inventory.short = True
    with pytest.raises(InsufficientStock):
        await sales.transition_order_status(ctx, order.order_id, S.CONFIRMED)
    assert (await sales.get_order(ctx, order.order_id)).status is S.DRAFT


async def test_fulfil_posts_the_sale_at_ledger_unit_costs(acme, fakes):
    sales, ctx, tenant, customer_id = acme
    order = await draft_order(sales, ctx, tenant, customer_id)
    await sales.transition_order_status(ctx, order.order_id, S.CONFIRMED)
    await sales.transition_order_status(ctx, order.order_id, S.FULFILLED)

    assert [c[0] for c in fakes.inventory.calls] == ["reserve", "ship"]
    [sale] = fakes.accounting.sales
    assert sale.document == document(order.order_id)
    [line] = sale.lines
    assert (line.product_id, line.quantity) == (tenant.product_id, 3)
    assert line.unit_price == Decimal("15.00")
    assert line.unit_cost == SHIP_COST  # from the SALE_SHIP row, not products.unit_cost
    assert sale.tax == Decimal("3.71")
