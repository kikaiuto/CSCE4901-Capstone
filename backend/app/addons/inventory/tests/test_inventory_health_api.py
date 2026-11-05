
"""Integration tests for the Smart Inventory Health API."""

import uuid
from decimal import Decimal

from app.addons.inventory.service import InventoryService
from app.core.contracts.common import DocumentKind, DocumentRef
from app.core.contracts.inventory import ReceivedLine, StockLine
from app.core.roles import Role
from app.core.tenancy import TenantContext, bind_session


def health_url(product_id):
    """Build the inventory health endpoint URL."""
    return f"/api/inventory/products/{product_id}/health"


async def create_test_product(client, tenant, threshold=10):
    """Create a tenant-owned product with a safety threshold."""

    payload = {
        "name": "Inventory Health Test Product",
        "sku": f"HEALTH-{uuid.uuid4().hex[:12]}",
        "category_id": str(tenant.category_id),
        "asset_account_id": str(tenant.asset_id),
        "revenue_account_id": str(tenant.revenue_id),
        "unit_cost": "10.0000",
        "unit_price": "20.0000",
        "safety_stock_threshold": threshold,
    }

    response = await client.post(
        "/api/inventory/products",
        json=payload,
        headers=tenant.headers(),
    )

    assert response.status_code == 201, response.text

    return uuid.UUID(response.json()["product_id"])


def owner_context(tenant):
    """Build an authenticated owner context for service tests."""

    return TenantContext(
        organization_id=tenant.organization_id,
        user_id=tenant.users[Role.OWNER],
        role=Role.OWNER,
    )


async def test_health_requires_authentication(client, tenants):
    """Unauthenticated users cannot access inventory health."""

    first, _ = tenants

    response = await client.get(
        health_url(first.product_id),
    )

    assert response.status_code == 401


async def test_health_rejects_invalid_token(client, tenants):
    """Invalid authentication tokens are rejected."""

    first, _ = tenants

    response = await client.get(
        health_url(first.product_id),
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401


async def test_health_rejects_unauthorized_role(client, tenants):
    """Users without inventory-read permission receive 403."""

    first, _ = tenants

    response = await client.get(
        health_url(first.product_id),
        headers=first.headers(Role.ACCOUNTING),
    )

    assert response.status_code == 403


async def test_health_blocks_cross_tenant_access(client, tenants):
    """An organization cannot read another tenant's product health."""

    first, second = tenants

    response = await client.get(
        health_url(second.product_id),
        headers=first.headers(),
    )

    missing = await client.get(
        health_url(uuid.uuid4()),
        headers=first.headers(),
    )

    assert response.status_code == 404
    assert response.json() == missing.json()


async def test_health_detects_out_of_stock(client, tenants):
    """A newly created product with no stock is out of stock."""

    first, _ = tenants

    product_id = await create_test_product(
        client,
        first,
        threshold=10,
    )

    response = await client.get(
        health_url(product_id),
        headers=first.headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["product_id"] == str(product_id)
    assert data["quantity"] == 0
    assert data["safety_stock_threshold"] == 10
    assert data["status"] == "OUT_OF_STOCK"
    assert data["suggested_restock_quantity"] == 10


async def test_health_is_healthy_at_threshold(
    client,
    sessions,
    tenants,
):
    """Stock exactly at the safety threshold is healthy."""

    first, _ = tenants

    product_id = await create_test_product(
        client,
        first,
        threshold=10,
    )

    async with sessions() as session:
        bind_session(session, first.organization_id)

        inventory_service = InventoryService(session)
        ctx = owner_context(first)

        document = DocumentRef(
            kind=DocumentKind.PURCHASE_ORDER,
            id=uuid.uuid4(),
            number="PO-HEALTH-001",
        )

        await inventory_service.receive(
            ctx,
            document,
            [
                ReceivedLine(
                    product_id,
                    10,
                    Decimal("10.0000"),
                )
            ],
        )

        await session.commit()

    response = await client.get(
        health_url(product_id),
        headers=first.headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["quantity"] == 10
    assert data["safety_stock_threshold"] == 10
    assert data["status"] == "HEALTHY"
    assert data["suggested_restock_quantity"] == 0


async def test_health_uses_available_stock_after_reservation(
    client,
    sessions,
    tenants,
):
    """Reserved stock reduces available stock for health calculations."""

    first, _ = tenants

    product_id = await create_test_product(
        client,
        first,
        threshold=5,
    )

    async with sessions() as session:
        bind_session(session, first.organization_id)

        inventory_service = InventoryService(session)
        ctx = owner_context(first)

        purchase_order = DocumentRef(
            kind=DocumentKind.PURCHASE_ORDER,
            id=uuid.uuid4(),
            number="PO-HEALTH-002",
        )

        sales_order = DocumentRef(
            kind=DocumentKind.SALES_ORDER,
            id=uuid.uuid4(),
            number="SO-HEALTH-001",
        )

        # Receive 10 units.
        await inventory_service.receive(
            ctx,
            purchase_order,
            [
                ReceivedLine(
                    product_id,
                    10,
                    Decimal("10.0000"),
                )
            ],
        )

        # Reserve 7 units for a sales order.
        await inventory_service.reserve(
            ctx,
            sales_order,
            [
                StockLine(
                    product_id,
                    7,
                )
            ],
        )

        await session.commit()

    # Available stock = 10 received - 7 reserved = 3.
    response = await client.get(
        health_url(product_id),
        headers=first.headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["quantity"] == 3
    assert data["safety_stock_threshold"] == 5
    assert data["status"] == "LOW_STOCK"
    assert data["suggested_restock_quantity"] == 2
