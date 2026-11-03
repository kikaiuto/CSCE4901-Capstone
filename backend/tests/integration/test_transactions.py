import importlib
from typing import Annotated

import pytest
from fastapi import Depends, FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.inventory.models import ProductCategory
from app.core import contracts
from app.core.contracts import provide
from app.core.db import get_session
from app.core.errors import Conflict, register_error_handlers
from app.core.tenancy import get_tenant_session


def application(sessions) -> FastAPI:
    importlib.import_module("app.addons.base.router")
    app = FastAPI()
    register_error_handlers(app)

    async def override_session():
        async with sessions() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    return app


@pytest.mark.parametrize("fail", [False, True])
async def test_request_transaction_commits_or_rolls_back(sessions, tenants, monkeypatch, fail):
    first, _ = tenants
    app = application(sessions)

    class Writer:
        def __init__(self, session):
            self.session = session

    monkeypatch.setitem(contracts._factories, Writer, Writer)

    @app.post("/write")
    async def write(
        session: Annotated[AsyncSession, Depends(get_tenant_session, scope="function")],
        writer: Annotated[Writer, Depends(provide(Writer))],
    ):
        assert writer.session is session
        category = ProductCategory(name="Transaction test", hierarchy_level=0)
        session.add(category)
        await session.flush()
        if fail:
            raise Conflict("Simulated failure after the first write")
        return {"category_id": str(category.category_id)}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/write", headers=first.headers())
    assert response.status_code == (409 if fail else 200)
    async with sessions() as session:
        category = await session.scalar(
            select(ProductCategory).where(ProductCategory.name == "Transaction test")
        )
        assert (category is None) is fail


async def test_commit_failure_is_not_reported_as_success(sessions, tenants):
    """The commit must finish before the response goes out (scope="function")."""
    first, _ = tenants
    app = application(sessions)

    @app.post("/write")
    async def write(
        session: Annotated[AsyncSession, Depends(get_tenant_session, scope="function")],
    ):
        session.add(ProductCategory(name=None, hierarchy_level=0))
        return {"ok": True}

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/write", headers=first.headers())
    assert response.status_code == 500
