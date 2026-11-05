"""Route contract tests for the procurement addon.

Features: F8, F9. Requirements: R16, R17."""

from decimal import Decimal

import pytest
from sqlalchemy import func, select

from app.addons.accounting.models import JournalEntry, JournalEntryLine
from app.addons.accounting.tests.conftest import add_accounts
from app.addons.procurement.models import PurchaseOrderLine
from app.core.roles import Role

API = "/api/procurement"


async def make_po(client, tenant, lines=((10, "2.5000"), (4, "1.3333"))):
    supplier = await client.post(
        f"{API}/suppliers", json={"name": "Bolt Co", "lead_time_days": 7}, headers=tenant.headers()
    )
    assert supplier.status_code == 201, supplier.text
    resp = await client.post(
        f"{API}/purchase-orders",
        json={
            "supplier_id": supplier.json()["supplier_id"],
            "total": "999.99",
            "lines": [
                {"product_id": str(tenant.product_id), "quantity": q, "unit_cost": c}
                for q, c in lines
            ],
        },
        headers=tenant.headers(Role.PURCHASING),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def receive(client, tenant, po, *quantities, role=Role.INVENTORY):
    body = {
        "lines": [
            {"line_id": line["line_id"], "quantity": q}
            for line, q in zip(po["lines"], quantities, strict=False)
            if q
        ]
    }
    return await client.post(
        f"{API}/purchase-orders/{po['po_id']}/receive", json=body, headers=tenant.headers(role)
    )


async def entries(sessions):
    async with sessions() as session:
        return list((await session.scalars(select(JournalEntry))).all())


async def entry_lines(sessions, entry_id):
    async with sessions() as session:
        rows = await session.scalars(
            select(JournalEntryLine).where(JournalEntryLine.entry_id == entry_id)
        )
        return sorted((str(r.account_id), r.debit, r.credit) for r in rows)


@pytest.fixture
async def accounts(sessions, tenants):
    return await add_accounts(sessions, tenants[0])


async def test_purchase_order_totals_are_computed_server_side(client, tenants, inventory):
    acme, _ = tenants
    po = await make_po(client, acme)
    assert po["status"] == "SUBMITTED"
    assert po["number"].startswith("PO-")
    assert sorted(x["line_total"] for x in po["lines"]) == ["25.00", "5.33"]
    assert po["total"] == "30.33"

    fetched = await client.get(f"{API}/purchase-orders/{po['po_id']}", headers=acme.headers())
    assert fetched.json() == po
    listed = await client.get(f"{API}/purchase-orders", headers=acme.headers(Role.ACCOUNTING))
    assert [x["po_id"] for x in listed.json()] == [po["po_id"]]


async def test_preview_matches_what_receiving_posts(client, tenants, sessions, inventory, accounts):
    acme, _ = tenants
    po = await make_po(client, acme)
    preview = await client.get(
        f"{API}/purchase-orders/{po['po_id']}/receive/preview", headers=acme.headers()
    )
    assert preview.status_code == 200, preview.text
    body = preview.json()
    assert body["journal_lines"] == [
        {"account_id": str(acme.asset_id), "debit": "30.33", "credit": "0.00", "memo": ""},
        {"account_id": str(accounts["2000"]), "debit": "0.00", "credit": "30.33", "memo": ""},
    ]
    assert sorted(x["average_cost_after"] for x in body["average_costs"]) == ["1.3333", "2.5000"]

    resp = await receive(client, acme, po, *(x["quantity"] for x in po["lines"]))
    assert resp.status_code == 200, resp.text
    [entry] = await entries(sessions)
    assert (entry.source, entry.description) == ("auto", f"Receipt {po['number']}")
    assert await entry_lines(sessions, entry.entry_id) == sorted(
        (x["account_id"], Decimal(x["debit"]), Decimal(x["credit"])) for x in body["journal_lines"]
    )


async def test_partial_then_full_receipt(client, tenants, sessions, inventory, accounts):
    acme, _ = tenants
    po = await make_po(client, acme)
    first_line, second_line = po["lines"]

    first = await receive(client, acme, po, 1)
    assert first.status_code == 200, first.text
    assert first.json()["status"] == "PARTIALLY_RECEIVED"
    assert [x["quantity_received"] for x in first.json()["lines"]] == [1, 0]
    [(document, received)] = inventory.receipts
    assert document.number == po["number"]
    assert [(x.quantity, x.unit_cost) for x in received] == [(1, Decimal(first_line["unit_cost"]))]

    rest = (first_line["quantity"] - 1, second_line["quantity"])
    second = await receive(client, acme, po, *rest)
    assert second.status_code == 200, second.text
    assert second.json()["status"] == "RECEIVED"
    assert len(await entries(sessions)) == 2

    again = await receive(client, acme, po, 1)
    assert again.status_code == 409
    assert again.json()["error"] == "not_receivable"


async def test_over_receipt_is_refused_and_writes_nothing(
    client, tenants, sessions, inventory, accounts
):
    acme, _ = tenants
    po = await make_po(client, acme)
    first_line = po["lines"][0]
    assert (await receive(client, acme, po, 1)).status_code == 200

    resp = await receive(client, acme, po, first_line["quantity"])
    assert resp.status_code == 409
    assert resp.json()["error"] == "over_receipt"
    assert resp.json()["details"]["outstanding"] == first_line["quantity"] - 1
    assert len(await entries(sessions)) == 1
    assert len(inventory.receipts) == 1
    async with sessions() as session:
        received = await session.scalar(select(func.sum(PurchaseOrderLine.quantity_received)))
    assert received == 1


async def test_missing_payable_account_refuses_the_receipt(client, tenants, sessions, inventory):
    acme, _ = tenants
    po = await make_po(client, acme)
    resp = await receive(client, acme, po, 1)
    assert resp.status_code == 422
    assert resp.json()["error"] == "missing_account"
    assert resp.json()["details"] == {"account": "2000 Accounts Payable"}
    assert await entries(sessions) == []
    fetched = await client.get(f"{API}/purchase-orders/{po['po_id']}", headers=acme.headers())
    assert fetched.json()["status"] == "SUBMITTED"


async def test_roles(client, tenants, inventory):
    acme, _ = tenants
    po = await make_po(client, acme)
    url = f"{API}/purchase-orders"
    assert (await client.get(url, headers=acme.headers(Role.SALES))).status_code == 403
    assert (await client.get(url, headers=acme.headers(Role.ACCOUNTING))).status_code == 200
    for role in (Role.SALES, Role.ACCOUNTING):
        assert (await receive(client, acme, po, 1, role=role)).status_code == 403
        resp = await client.post(f"{API}/suppliers", json={"name": "X"}, headers=acme.headers(role))
        assert resp.status_code == 403
