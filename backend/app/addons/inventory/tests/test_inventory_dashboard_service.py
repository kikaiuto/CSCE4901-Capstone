"""Read-only inventory dashboard KPI calculations and tenant isolation."""

from decimal import Decimal
from uuid import uuid4

from app.addons.inventory.models import InventoryLedger, Product, StockReservation
from app.addons.inventory.service import InventoryService
from app.core.roles import Role
from app.core.tenancy import TenantContext, bind_session


async def test_dashboard_reports_zero_stock(sessions, tenants):
    first, _ = tenants

    ctx = TenantContext(
        first.organization_id,
        first.users[Role.OWNER],
        Role.OWNER,
    )

    async with sessions() as session:
        bind_session(session, first.organization_id)

        metrics = await InventoryService(session).get_dashboard_metrics(ctx)

    assert metrics.total_products == 1
    assert metrics.on_hand_units == 0
    assert metrics.available_units == 0
    assert metrics.inventory_value == Decimal("0")
    assert metrics.low_stock_products == 0
    assert metrics.out_of_stock_products == 1


async def test_dashboard_calculates_stock_and_isolates_tenants(
    sessions,
    tenants,
):
    first, second = tenants

    async with sessions() as session:
        bind_session(session, first.organization_id)

        product = await session.get(Product, first.product_id)
        assert product is not None

        product.safety_stock_threshold = 10

        session.add_all(
            [
                InventoryLedger(
                    organization_id=first.organization_id,
                    product_id=first.product_id,
                    change_quantity=12,
                    resulting_on_hand=12,
                    unit_cost=Decimal("10.0000"),
                ),
                StockReservation(
                    organization_id=first.organization_id,
                    product_id=first.product_id,
                    document_kind="sales_order",
                    document_id=uuid4(),
                    document_number="DASHBOARD-TEST",
                    change_quantity=5,
                ),
            ]
        )

        await session.commit()

    first_ctx = TenantContext(
        first.organization_id,
        first.users[Role.OWNER],
        Role.OWNER,
    )

    second_ctx = TenantContext(
        second.organization_id,
        second.users[Role.OWNER],
        Role.OWNER,
    )

    async with sessions() as session:
        bind_session(session, first.organization_id)

        metrics = await InventoryService(session).get_dashboard_metrics(first_ctx)

    assert metrics.total_products == 1
    assert metrics.on_hand_units == 12
    assert metrics.available_units == 7
    assert metrics.inventory_value == Decimal("120.0000")
    assert metrics.low_stock_products == 1
    assert metrics.out_of_stock_products == 0

    async with sessions() as session:
        bind_session(session, second.organization_id)

        other = await InventoryService(session).get_dashboard_metrics(second_ctx)

    assert other.total_products == 1
    assert other.on_hand_units == 0
    assert other.available_units == 0
    assert other.inventory_value == Decimal("0")
    assert other.low_stock_products == 0
    assert other.out_of_stock_products == 1
