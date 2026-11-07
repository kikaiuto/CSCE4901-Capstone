"""Cross-tenant isolation tests for the inventory addon.

Features: F4, F5, F6, F9, F19. Requirements: R7, R8, R9, R10, R11, R12, R31.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""

import uuid


async def test_product_endpoints_hide_other_tenants(client, tenants):
    first, second = tenants
    response = await client.get(
        "/api/inventory/products",
        headers=first.headers(),
        params={"organization_id": str(second.organization_id)},
    )
    assert response.status_code == 200
    assert [row["product_id"] for row in response.json()] == [str(first.product_id)]
    own = await client.get(f"/api/inventory/products/{first.product_id}", headers=first.headers())
    assert own.status_code == 200
    hidden = await client.get(
        f"/api/inventory/products/{second.product_id}", headers=first.headers()
    )
    absent = await client.get(f"/api/inventory/products/{uuid.uuid4()}", headers=first.headers())
    assert hidden.status_code == absent.status_code == 404
    assert hidden.json() == absent.json()


async def test_category_list_hides_other_tenants(client, tenants):
    first, second = tenants
    response = await client.get(
        "/api/inventory/categories",
        headers=first.headers(),
        params={"organization_id": str(second.organization_id)},
    )
    assert response.status_code == 200
    assert [row["category_id"] for row in response.json()] == [str(first.category_id)]
