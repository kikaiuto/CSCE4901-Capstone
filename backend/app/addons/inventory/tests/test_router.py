"""Route contract tests for the inventory addon.

Features: F4, F5, F6, F9, F19. Requirements: R7, R8, R9, R10, R11, R12, R31."""

from app.core.roles import Role


async def test_product_list_requires_login(client):
    response = await client.get("/api/inventory/products")
    assert response.status_code == 401


async def test_product_list_rejects_invalid_token(client):
    response = await client.get(
        "/api/inventory/products", headers={"Authorization": "Bearer invalid-token"}
    )
    assert response.status_code == 401


async def test_product_permission_matches_the_access_matrix(client, tenants):
    first, _ = tenants
    for role in Role:
        response = await client.get("/api/inventory/products", headers=first.headers(role))
        assert response.status_code == (403 if role is Role.ACCOUNTING else 200)


async def test_category_permission_matches_the_access_matrix(client, tenants):
    first, _ = tenants
    for role in Role:
        response = await client.get("/api/inventory/categories", headers=first.headers(role))
        assert response.status_code == (403 if role is Role.ACCOUNTING else 200)


async def test_category_list_names_the_tenant_categories(client, tenants):
    first, _ = tenants
    response = await client.get("/api/inventory/categories", headers=first.headers())
    assert response.status_code == 200
    assert response.json() == [{"category_id": str(first.category_id), "name": "Parts"}]


async def test_product_list_carries_both_costs(client, tenants):
    first, _ = tenants
    response = await client.get("/api/inventory/products", headers=first.headers())
    [product] = response.json()
    assert (product["unit_cost"], product["average_cost"]) == ("10.0000", "10.0000")
