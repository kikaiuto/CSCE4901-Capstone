"""Route contract tests for the accounting addon.

Features: F10, F11, F12, F13, F19. Requirements: R18, R19, R20, R21, R22, R23, R31."""

from sqlalchemy import func, select

from app.addons.accounting.models import JournalEntry, JournalEntryLine
from app.core.roles import Role

URL = "/api/accounting/journal-entries"


def entry(tenant, debit="250.00", credit="250.00", entry_date="2026-11-01"):
    return {
        "entry_date": entry_date,
        "memo": "Owner contribution",
        "lines": [
            {"account_id": str(tenant.asset_id), "debit": debit, "credit": "0.00", "memo": "in"},
            {"account_id": str(tenant.revenue_id), "debit": "0.00", "credit": credit},
        ],
    }


async def row_counts(sessions):
    async with sessions() as session:
        entries = await session.scalar(select(func.count()).select_from(JournalEntry))
        lines = await session.scalar(select(func.count()).select_from(JournalEntryLine))
    return entries, lines


async def test_accounts_are_listed_by_code_with_lowercase_type(client, tenants):
    acme, _ = tenants
    resp = await client.get("/api/accounting/accounts", headers=acme.headers(Role.ACCOUNTING))
    assert resp.status_code == 200
    assert [(a["account_code"], a["account_type"]) for a in resp.json()] == [
        ("1200", "asset"),
        ("4000", "revenue"),
    ]


async def test_balanced_entry_posts(client, tenants, sessions):
    acme, _ = tenants
    resp = await client.post(URL, json=entry(acme), headers=acme.headers(Role.ACCOUNTING))
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "POSTED"
    assert body["source"] == "manual"
    assert body["entry_date"] == "2026-11-01"
    assert body["total_debits"] == body["total_credits"] == "250.00"
    assert [(x["debit"], x["credit"], x["memo"]) for x in body["lines"]] == [
        ("250.00", "0.00", "in"),
        ("0.00", "250.00", ""),
    ]
    assert await row_counts(sessions) == (1, 2)

    listed = await client.get(URL, headers=acme.headers())
    assert listed.status_code == 200
    [summary] = listed.json()
    assert summary["entry_id"] == body["entry_id"]
    assert (summary["memo"], summary["source"], summary["total"]) == (
        "Owner contribution",
        "manual",
        "250.00",
    )


async def test_entries_are_listed_newest_first(client, tenants):
    acme, _ = tenants
    for day in ("2026-10-01", "2026-10-03", "2026-10-02"):
        resp = await client.post(URL, json=entry(acme, entry_date=day), headers=acme.headers())
        assert resp.status_code == 201
    listed = await client.get(URL, params={"limit": 2}, headers=acme.headers())
    assert [e["entry_date"] for e in listed.json()] == ["2026-10-03", "2026-10-02"]


async def test_unbalanced_entry_is_refused_and_writes_nothing(client, tenants, sessions):
    acme, _ = tenants
    resp = await client.post(URL, json=entry(acme, credit="200.00"), headers=acme.headers())
    assert resp.status_code == 422
    body = resp.json()
    assert body["error"] == "unbalanced_entry"
    assert body["details"] == {
        "total_debits": "250.00",
        "total_credits": "200.00",
        "difference": "50.00",
        "line_errors": [],
    }
    assert await row_counts(sessions) == (0, 0)


async def test_malformed_line_is_refused(client, tenants, sessions):
    acme, _ = tenants
    resp = await client.post(
        URL, json=entry(acme, debit="1.005", credit="1.005"), headers=acme.headers()
    )
    assert resp.status_code == 422
    assert resp.json()["details"]["line_errors"] == [
        {"index": 0, "problem": "too_precise"},
        {"index": 1, "problem": "too_precise"},
    ]
    assert await row_counts(sessions) == (0, 0)


async def test_wrong_role_is_forbidden(client, tenants, sessions):
    acme, _ = tenants
    for role in (Role.SALES, Role.INVENTORY, Role.PURCHASING):
        assert (
            await client.post(URL, json=entry(acme), headers=acme.headers(role))
        ).status_code == 403
        assert (await client.get(URL, headers=acme.headers(role))).status_code == 403
        assert (
            await client.get("/api/accounting/accounts", headers=acme.headers(role))
        ).status_code == 403
    assert await row_counts(sessions) == (0, 0)
