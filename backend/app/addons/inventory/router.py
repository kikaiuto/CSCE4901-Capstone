"""Tenant-protected product reads."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.inventory import service
from app.addons.inventory.permissions import READ_PRODUCTS
from app.addons.inventory.schemas import ProductResponse
from app.core.tenancy import TenantContext, get_tenant_session

router = APIRouter()


@router.get("/products", response_model=list[ProductResponse])
async def list_products_route(
    ctx: Annotated[TenantContext, Depends(READ_PRODUCTS)],
    session: Annotated[AsyncSession, Depends(get_tenant_session)],
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[ProductResponse]:
    products = await service.list_products(
        session=session,
        organization_id=ctx.organization_id,
        limit=limit,
        offset=offset,
    )
    return [ProductResponse.model_validate(product) for product in products]


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product_route(
    product_id: UUID,
    ctx: Annotated[TenantContext, Depends(READ_PRODUCTS)],
    session: Annotated[AsyncSession, Depends(get_tenant_session)],
) -> ProductResponse:
    product = await service.get_product(
        session=session,
        organization_id=ctx.organization_id,
        product_id=product_id,
    )
    return ProductResponse.model_validate(product)
