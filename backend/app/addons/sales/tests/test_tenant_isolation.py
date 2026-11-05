"""Cross-tenant isolation tests for the sales addon.

Features: F3, F6, F7. Requirements: R5, R6, R13, R14, R15.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""

from app.addons.sales.tests.test_router import API, new_customer, new_order


async def test_tenant_cannot_read_or_move_another_tenants_order(client, tenants, fakes):
    acme, northstar = tenants
    order = await new_order(client, acme)
    url = f"{API}/orders/{order['order_id']}"
    assert (await client.get(url, headers=northstar.headers())).status_code == 404
    assert (await client.get(f"{API}/orders", headers=northstar.headers())).json() == []
    assert (await client.post(f"{url}/confirm", headers=northstar.headers())).status_code == 404
    assert fakes.inventory.calls == []


async def test_tenant_cannot_read_or_use_another_tenants_customer(client, tenants):
    acme, northstar = tenants
    customer_id = await new_customer(client, acme)
    resp = await client.get(f"{API}/customers/{customer_id}", headers=northstar.headers())
    assert resp.status_code == 404
    assert (await client.get(f"{API}/customers", headers=northstar.headers())).json() == []

    body = {
        "customer_id": customer_id,
        "lines": [{"product_id": str(northstar.product_id), "quantity": 1}],
    }
    resp = await client.post(f"{API}/orders", json=body, headers=northstar.headers())
    assert resp.status_code == 422
    assert resp.json()["details"] == {"field": "customer_id"}


async def test_another_tenants_product_is_refused(client, tenants):
    acme, northstar = tenants
    customer_id = await new_customer(client, acme)
    body = {
        "customer_id": customer_id,
        "lines": [{"product_id": str(northstar.product_id), "quantity": 1}],
    }
    resp = await client.post(f"{API}/orders", json=body, headers=acme.headers())
    assert resp.status_code == 422
    assert resp.json()["details"] == {"field": "lines[0].product_id"}
