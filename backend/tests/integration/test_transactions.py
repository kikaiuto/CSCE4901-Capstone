from typing import Annotated

import pytest
from fastapi import Depends, FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.inventory.models import ProductCategory
from app.core.contracts import bind, provide
from app.core.db import get_session
from app.core.errors import Conflict, register_error_handlers
from app.core.tenancy import get_tenant_session


@pytest.mark.parametrize("fail", [False, True])
async def test_request_transaction_commits_or_rolls_back(sessions, tenants, fail):
    first, _ = tenants
    application = FastAPI()
    register_error_handlers(application)

    class Writer:
        def __init__(self, session):
            self.session = session

    bind(Writer, Writer)

    @application.post("/write")
    async def write(
        session: Annotated[AsyncSession, Depends(get_tenant_session)],
        writer: Annotated[Writer, Depends(provide(Writer))],
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
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.post("/write", headers=first.headers())
    assert response.status_code == (409 if fail else 200)
    async with sessions() as session:
        category = await session.scalar(
            select(ProductCategory).where(ProductCategory.name == "Transaction test")
        )
        assert (category is None) is fail
