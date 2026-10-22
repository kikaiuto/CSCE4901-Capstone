"""Errors reach the client with what the screen needs, and 500s reveal nothing."""

import uuid
from decimal import Decimal

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.contracts.accounting import BalanceCheck, LineError, LineProblem, UnbalancedEntry
from app.core.contracts.inventory import InsufficientStock, Shortage
from app.core.errors import CrossTenantWrite, register_error_handlers

PRODUCT = uuid.uuid4()


def app_raising(exc: Exception) -> FastAPI:
    app = FastAPI()
    register_error_handlers(app)

    @app.get("/boom")
    async def boom() -> None:
        raise exc

    return app


async def get(app: FastAPI):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        return await c.get("/boom")


async def test_insufficient_stock_lists_every_short_line():
    resp = await get(app_raising(InsufficientStock([Shortage(PRODUCT, 10, 4)])))
    assert resp.status_code == 409
    assert resp.json()["details"]["shortages"] == [
        {"product_id": str(PRODUCT), "requested": 10, "available": 4}
    ]


async def test_unbalanced_entry_names_the_cause():
    check = BalanceCheck(Decimal("2000.00"), Decimal("1900.00"), Decimal("100.00"))
    resp = await get(app_raising(UnbalancedEntry(check)))
    assert resp.status_code == 422
    assert resp.json()["message"] == "Debits and credits differ by 100.00"
    assert resp.json()["details"]["difference"] == "100.00"


async def test_malformed_line_is_named_even_when_totals_match():
    check = BalanceCheck(
        Decimal("5.00"),
        Decimal("5.00"),
        Decimal("0.00"),
        line_errors=(LineError(0, LineProblem.BOTH_SIDES),),
    )
    assert not check.is_balanced
    resp = await get(app_raising(UnbalancedEntry(check)))
    assert resp.json()["message"] == "Line 1: both sides"


async def test_server_errors_do_not_echo_their_message():
    resp = await get(app_raising(CrossTenantWrite("User row(s) outside this organization")))
    assert resp.status_code == 500
    assert "organization" not in resp.text
