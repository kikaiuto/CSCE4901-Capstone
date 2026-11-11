
"""API tests for the tenant-scoped operational inventory dashboard."""

from decimal import Decimal
from uuid import uuid4

from app.addons.inventory.models import InventoryLedger, Product, StockReservation
from app.core.roles import Role
from app.core.tenancy import bind_session

PATH = "/api/home/dashboard/inventory"


async def test_dashboard_requires_authentication(client):
    """Unauthenticated users cannot access dashboard metrics."""

    response = await client.get(PATH)

    assert response.status_code == 401


async def test_dashboard_enforces_permissions(client, tenants):
    """Accounting-only users cannot read the inventory dashboard."""

    first, _ = tenants

    forbidden = await client.get(
        PATH,
        headers=first.headers(Role.ACCOUNTING),
    )

    allowed = await client.get(
        PATH,
        headers=first.headers(Role.OWNER),
    )

    assert forbidden.status_code == 403
    assert allowed.status_code == 200


async def test_dashboard_returns_zero_stock(client, tenants):
    """A new product without ledger movements has zero stock."""

    first, second = tenants

    response = await client.get(
        PATH,
        headers=first.headers(Role.OWNER),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total_products"] == 1
    assert data["on_hand_units"] == 0
    assert data["available_units"] == 0
    assert Decimal(str(data["inventory_value"])) == Decimal("0")
    assert data["low_stock_products"] == 0
    assert data["out_of_stock_products"] == 1

    other = await client.get(
        PATH,
        headers=second.headers(Role.OWNER),
    )

    assert other.status_code == 200
    assert other.json() == data


async def test_dashboard_returns_real_stock_and_isolates_tenants(
    client,
    sessions,
    tenants,
):
    """The dashboard must use actual stock and never leak another tenant's data."""

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
                    reference_document="DASHBOARD-RECEIPT",
                ),
                StockReservation(
                    organization_id=first.organization_id,
                    product_id=first.product_id,
                    document_kind="sales_order",
                    document_id=uuid4(),
                    document_number="DASHBOARD-ORDER",
                    change_quantity=5,
                ),
            ]
        )

        await session.commit()

    response = await client.get(
        PATH,
        headers=first.headers(Role.OWNER),
    )

    assert response.status_code == 200

    data = response.json()

    # 12 units received, 5 reserved, 7 available.
    assert data["total_products"] == 1
    assert data["on_hand_units"] == 12
    assert data["available_units"] == 7

    # Inventory valuation uses on-hand quantity, not available quantity.
    assert Decimal(str(data["inventory_value"])) == Decimal("120.0000")

    assert data["low_stock_products"] == 1
    assert data["out_of_stock_products"] == 0

    # The second tenant must not see the first tenant's inventory.
    other = await client.get(
        PATH,
        headers=second.headers(Role.OWNER),
    )

    assert other.status_code == 200

    other_data = other.json()

    assert other_data["total_products"] == 1
    assert other_data["on_hand_units"] == 0
    assert other_data["available_units"] == 0
    assert Decimal(str(other_data["inventory_value"])) == Decimal("0")
