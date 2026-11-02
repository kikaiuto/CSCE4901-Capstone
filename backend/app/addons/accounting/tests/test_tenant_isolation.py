"""Cross-tenant isolation tests for the accounting addon.

Features: F10, F11, F12, F13, F19. Requirements: R18, R19, R20, R21, R22, R23, R31.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""

from app.addons.accounting.tests.test_router import URL, entry, row_counts


async def test_other_tenants_account_is_refused(client, tenants, sessions):
    acme, northstar = tenants
    body = entry(acme)
    body["lines"][1]["account_id"] = str(northstar.revenue_id)
    resp = await client.post(URL, json=body, headers=acme.headers())
    assert resp.status_code == 422
    assert resp.json()["error"] == "unknown_account"
    assert resp.json()["details"] == {"field": "lines[1].account_id"}
    assert await row_counts(sessions) == (0, 0)


async def test_tenant_cannot_list_another_tenants_entries_or_accounts(client, tenants):
    acme, northstar = tenants
    assert (await client.post(URL, json=entry(acme), headers=acme.headers())).status_code == 201
    assert (await client.get(URL, headers=northstar.headers())).json() == []
    accounts = await client.get("/api/accounting/accounts", headers=northstar.headers())
    assert {a["account_id"] for a in accounts.json()} == {
        str(northstar.asset_id),
        str(northstar.revenue_id),
    }
