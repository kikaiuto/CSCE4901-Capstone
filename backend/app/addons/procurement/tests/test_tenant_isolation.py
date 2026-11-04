"""Cross-tenant isolation tests for the procurement addon.

Features: F8, F9. Requirements: R16, R17.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""

from app.addons.procurement.tests.test_router import API, make_po, receive


async def test_other_tenant_cannot_see_or_receive_a_purchase_order(client, tenants, inventory):
    acme, northstar = tenants
    po = await make_po(client, acme)
    url = f"{API}/purchase-orders/{po['po_id']}"

    assert (await client.get(url, headers=northstar.headers())).status_code == 404
    preview = await client.get(f"{url}/receive/preview", headers=northstar.headers())
    assert preview.status_code == 404
    assert (await receive(client, northstar, po, 1)).status_code == 404
    assert (await client.get(f"{API}/purchase-orders", headers=northstar.headers())).json() == []
    assert (await client.get(f"{API}/suppliers", headers=northstar.headers())).json() == []
    fetched = await client.get(url, headers=acme.headers())
    assert [x["quantity_received"] for x in fetched.json()["lines"]] == [0, 0]


async def test_other_tenants_supplier_and_product_are_refused(client, tenants, inventory):
    acme, northstar = tenants
    po = await make_po(client, acme)
    body = {
        "supplier_id": po["supplier_id"],
        "lines": [{"product_id": str(northstar.product_id), "quantity": 1, "unit_cost": "1"}],
    }
    resp = await client.post(f"{API}/purchase-orders", json=body, headers=northstar.headers())
    assert (resp.status_code, resp.json()["details"]) == (422, {"field": "supplier_id"})

    supplier = await client.post(
        f"{API}/suppliers", json={"name": "Own"}, headers=northstar.headers()
    )
    body["supplier_id"] = supplier.json()["supplier_id"]
    body["lines"][0]["product_id"] = str(acme.product_id)
    resp = await client.post(f"{API}/purchase-orders", json=body, headers=northstar.headers())
    assert (resp.status_code, resp.json()["details"]) == (422, {"field": "lines[0].product_id"})
