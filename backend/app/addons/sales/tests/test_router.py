"""Route contract tests for the sales addon.

Features: F3, F6, F7. Requirements: R5, R6, R13, R14, R15."""

from sqlalchemy import select

from app.addons.sales.models import SalesOrder
from app.core.roles import Role

API = "/api/sales"


async def new_customer(client, tenant, name="Buyer"):
    resp = await client.post(f"{API}/customers", json={"name": name}, headers=tenant.headers())
    assert resp.status_code == 201, resp.text
    return resp.json()["customer_id"]


async def new_order(client, tenant, quantity=2):
    customer_id = await new_customer(client, tenant)
    body = {
        "customer_id": customer_id,
        # Client totals and prices are not part of the schema and are ignored.
        "order_total": "0.01",
        "lines": [{"product_id": str(tenant.product_id), "quantity": quantity, "line_total": "1"}],
    }
    resp = await client.post(f"{API}/orders", json=body, headers=tenant.headers(Role.SALES))
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_customers_are_created_listed_and_read(client, tenants):
    acme, _ = tenants
    customer_id = await new_customer(client, acme, "Zed Corp")
    await new_customer(client, acme, "Alpha LLC")
    listed = await client.get(f"{API}/customers", headers=acme.headers(Role.ACCOUNTING))
    assert [c["name"] for c in listed.json()] == ["Alpha LLC", "Zed Corp"]
    one = await client.get(f"{API}/customers/{customer_id}", headers=acme.headers())
    assert one.json()["credit_status"] == "GOOD"


async def test_order_totals_come_from_the_server(client, tenants):
    acme, _ = tenants
    order = await new_order(client, acme)
    assert order["status"] == "DRAFT"
    assert order["lines"][0]["line_total"] == "30.00"
    assert (order["subtotal"], order["tax"], order["order_total"]) == ("30.00", "2.48", "32.48")

    got = await client.get(f"{API}/orders/{order['order_id']}", headers=acme.headers())
    # SQLite drops the timezone on read, so created_at is left out of the comparison.
    assert {**got.json(), "created_at": None} == {**order, "created_at": None}
    listed = await client.get(f"{API}/orders", params={"status": "DRAFT"}, headers=acme.headers())
    assert [o["order_id"] for o in listed.json()] == [order["order_id"]]
    none = await client.get(f"{API}/orders", params={"status": "FULFILLED"}, headers=acme.headers())
    assert none.json() == []


async def test_confirm_fulfil_cancel_endpoints(client, tenants, fakes):
    acme, _ = tenants
    order = await new_order(client, acme)
    url = f"{API}/orders/{order['order_id']}"
    confirmed = await client.post(f"{url}/confirm", headers=acme.headers(Role.SALES))
    assert confirmed.json()["status"] == "CONFIRMED"
    fulfilled = await client.post(f"{url}/fulfil", headers=acme.headers(Role.SALES))
    assert fulfilled.json()["status"] == "FULFILLED"
    assert len(fakes.accounting.sales) == 1

    refused = await client.post(f"{url}/cancel", headers=acme.headers(Role.SALES))
    assert refused.status_code == 409
    assert refused.json()["error"] == "invalid_transition"
    assert refused.json()["details"] == {
        "current": "FULFILLED",
        "requested": "CANCELLED",
        "allowed": [],
    }


async def test_failed_confirm_rolls_back_and_stays_draft(client, tenants, fakes, sessions):
    acme, _ = tenants
    order = await new_order(client, acme)
    fakes.inventory.short = True
    resp = await client.post(f"{API}/orders/{order['order_id']}/confirm", headers=acme.headers())
    assert resp.status_code == 409
    assert resp.json()["error"] == "insufficient_stock"
    async with sessions() as session:
        status = await session.scalar(select(SalesOrder.status))
    assert status == "DRAFT"


async def test_unknown_order_is_404(client, tenants):
    acme, _ = tenants
    resp = await client.get(f"{API}/orders/{acme.product_id}", headers=acme.headers())
    assert resp.status_code == 404


async def test_wrong_role_is_forbidden(client, tenants, fakes):
    acme, _ = tenants
    order = await new_order(client, acme)
    url = f"{API}/orders/{order['order_id']}"
    for role in (Role.INVENTORY, Role.PURCHASING):
        for path in ("/customers", "/orders", f"/orders/{order['order_id']}"):
            assert (await client.get(f"{API}{path}", headers=acme.headers(role))).status_code == 403
    for role in (Role.INVENTORY, Role.PURCHASING, Role.ACCOUNTING):
        headers = acme.headers(role)
        assert (
            await client.post(f"{API}/customers", json={"name": "X"}, headers=headers)
        ).status_code == 403
        assert (
            await client.post(f"{API}/orders", json={"customer_id": "x"}, headers=headers)
        ).status_code == 403
        for action in ("confirm", "fulfil", "cancel"):
            assert (await client.post(f"{url}/{action}", headers=headers)).status_code == 403
    assert fakes.inventory.calls == []
