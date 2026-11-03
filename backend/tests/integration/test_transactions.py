"""A response must not report success until its transaction has committed."""

import json
from typing import Annotated
from urllib.parse import urlsplit

import pytest
from fastapi import Depends
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.accounting.models import JournalEntry, JournalEntryLine
from app.addons.inventory.models import ProductCategory
from app.core import contracts
from app.core.contracts import bind, provide
from app.core.db import ORGANIZATION_KEY, get_session
from app.core.errors import Conflict
from app.core.tenancy import get_tenant_session
from app.main import create_app


@pytest.fixture
async def transaction_app(sessions, monkeypatch):
    application = create_app()
    monkeypatch.setattr(contracts, "_factories", contracts._factories.copy())

    class Writer:
        def __init__(self, session):
            self.session = session

    bind(Writer, Writer)

    @application.post("/write")
    async def write(
        session: Annotated[AsyncSession, Depends(get_tenant_session, scope="function")],
        writer: Annotated[Writer, Depends(provide(Writer))],
        fail: bool = False,
    ):
        assert writer.session is session
        category = ProductCategory(name="Transaction test", hierarchy_level=0)
        session.add(category)
        await session.flush()
        if fail:
            raise Conflict("Simulated failure after the first write")
        return {"category_id": str(category.category_id)}

    async def override_session():
        async with sessions() as session:
            yield session

    application.dependency_overrides[get_session] = override_session
    return application


async def invoke(application, method, path, headers, send, body=None):
    """Capture ASGI send events; HTTPX waits until dependency cleanup has finished."""
    url = urlsplit(path)
    if body is not None:
        headers = headers | {"Content-Type": "application/json"}
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": url.path,
        "raw_path": url.path.encode(),
        "query_string": url.query.encode(),
        "headers": [(key.lower().encode(), value.encode()) for key, value in headers.items()],
        "client": ("127.0.0.1", 12345),
        "server": ("test", 80),
        "root_path": "",
    }

    async def receive():
        return {
            "type": "http.request",
            "body": json.dumps(body).encode() if body is not None else b"",
            "more_body": False,
        }

    await application(scope, receive, send)


def journal_body(tenant):
    return {
        "entry_date": "2026-11-03",
        "memo": "Transaction timing test",
        "lines": [
            {"account_id": str(tenant.asset_id), "debit": "25.00", "credit": "0.00"},
            {"account_id": str(tenant.revenue_id), "debit": "0.00", "credit": "25.00"},
        ],
    }


@pytest.mark.parametrize("fail", [False, True])
async def test_request_transaction_commits_or_rolls_back(transaction_app, sessions, tenants, fail):
    first, _ = tenants
    async with AsyncClient(
        transport=ASGITransport(app=transaction_app), base_url="http://test"
    ) as client:
        response = await client.post("/write", headers=first.headers(), params={"fail": fail})
    assert response.status_code == (409 if fail else 200)
    async with sessions() as session:
        category = await session.scalar(
            select(ProductCategory).where(ProductCategory.name == "Transaction test")
        )
        assert (category is None) is fail


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("POST", "/write"),
        ("GET", "/api/base/users"),
        ("GET", "/api/inventory/products"),
        ("GET", "/api/base/auth/me"),
        ("GET", "/api/accounting/accounts"),
        ("GET", "/api/accounting/journal-entries"),
        ("POST", "/api/accounting/journal-entries"),
    ],
)
async def test_commit_failure_never_sends_a_success_response(
    transaction_app,
    sessions,
    tenants,
    monkeypatch,
    method,
    path,
):
    first, _ = tenants
    original_commit = AsyncSession.commit

    async def fail_commit(session):
        if ORGANIZATION_KEY in session.info:
            raise OperationalError("COMMIT", {}, RuntimeError("simulated commit failure"))
        await original_commit(session)

    monkeypatch.setattr(AsyncSession, "commit", fail_commit)
    messages = []

    async def send(message):
        messages.append(message)

    with pytest.raises(OperationalError):
        body = journal_body(first) if method == "POST" and path.startswith("/api/") else None
        await invoke(transaction_app, method, path, first.headers(), send, body)
    assert [m["status"] for m in messages if m["type"] == "http.response.start"] == [500]
    async with sessions() as session:
        assert (
            await session.scalar(
                select(ProductCategory).where(ProductCategory.name == "Transaction test")
            )
            is None
        )
        assert (await session.scalars(select(JournalEntry))).all() == []
        assert (await session.scalars(select(JournalEntryLine))).all() == []


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("POST", "/write"),
        ("GET", "/api/base/users"),
        ("GET", "/api/inventory/products"),
        ("GET", "/api/base/auth/me"),
        ("GET", "/api/accounting/accounts"),
        ("GET", "/api/accounting/journal-entries"),
        ("POST", "/api/accounting/journal-entries"),
    ],
)
async def test_commit_finishes_before_the_response_starts(
    transaction_app,
    tenants,
    monkeypatch,
    method,
    path,
):
    first, _ = tenants
    events = []
    original_commit = AsyncSession.commit

    async def record_commit(session):
        await original_commit(session)
        events.append("committed")

    monkeypatch.setattr(AsyncSession, "commit", record_commit)

    async def send(message):
        events.append(message["type"])

    body = journal_body(first) if method == "POST" and path.startswith("/api/") else None
    await invoke(transaction_app, method, path, first.headers(), send, body)
    assert events.count("committed") == 1
    assert events.index("committed") < events.index("http.response.start")
