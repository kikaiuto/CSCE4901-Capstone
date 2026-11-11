"""Tests for tenant-scoped inventory dashboard aggregation."""

from decimal import Decimal
from uuid import uuid4

from app.addons.inventory import repository
from app.addons.inventory.models import InventoryLedger, Product, StockReservation
from app.core.tenancy import bind_session


async def test_dashboard_includes_products_without_stock(sessions, tenants):
    """Products with no ledger entries must report zero stock."""

    first, second = tenants

    async with sessions() as session:
        bind_session(session, first.organization_id)
        first_rows = await repository.inventory_dashboard_rows(
            session,
            first.organization_id,
        )

    async with sessions() as session:
        bind_session(session, second.organization_id)
        second_rows = await repository.inventory_dashboard_rows(
            session,
            second.organization_id,
        )

    assert first_rows == [
        (0, Decimal("10.0000"), 0, 0),
    ]

    assert second_rows == [
        (0, Decimal("10.0000"), 0, 0),
    ]


async def test_dashboard_aggregates_stock_without_double_counting(
    sessions,
    tenants,
):
    """Multiple ledger and reservation rows must aggregate correctly."""

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
                    change_quantity=8,
                    resulting_on_hand=8,
                    unit_cost=Decimal("10.0000"),
                    reference_document="TEST-RECEIPT-1",
                ),
                InventoryLedger(
                    organization_id=first.organization_id,
                    product_id=first.product_id,
                    change_quantity=4,
                    resulting_on_hand=12,
                    unit_cost=Decimal("10.0000"),
                    reference_document="TEST-RECEIPT-2",
                ),
                StockReservation(
                    organization_id=first.organization_id,
                    product_id=first.product_id,
                    document_kind="sales_order",
                    document_id=uuid4(),
                    document_number="TEST-ORDER-1",
                    change_quantity=3,
                ),
                StockReservation(
                    organization_id=first.organization_id,
                    product_id=first.product_id,
                    document_kind="sales_order",
                    document_id=uuid4(),
                    document_number="TEST-ORDER-2",
                    change_quantity=2,
                ),
            ]
        )

        await session.commit()

    async with sessions() as session:
        bind_session(session, first.organization_id)
        first_rows = await repository.inventory_dashboard_rows(
            session,
            first.organization_id,
        )

    # On hand: 8 + 4 = 12
    # Committed: 3 + 2 = 5
    # Available: 12 - 5 = 7
    assert first_rows == [
        (10, Decimal("10.0000"), 12, 5),
    ]

    # The other organization's records must remain isolated.
    async with sessions() as session:
        bind_session(session, second.organization_id)
        second_rows = await repository.inventory_dashboard_rows(
            session,
            second.organization_id,
        )

    assert second_rows == [
        (0, Decimal("10.0000"), 0, 0),
    ]
