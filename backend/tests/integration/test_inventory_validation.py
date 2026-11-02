"""Additional inventory API security tests."""


async def test_product_list_requires_login(client):
    response = await client.get("/api/inventory/products")

    assert response.status_code == 401


async def test_product_list_rejects_invalid_token(client):
    response = await client.get(
        "/api/inventory/products",
        headers={
            "Authorization": "Bearer invalid-token"
        },
    )

    assert response.status_code == 401