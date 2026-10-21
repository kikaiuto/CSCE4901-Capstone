"""Protected API routes for inventory management."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base.schemas import CurrentUserResponse
from app.addons.inventory import service
from app.addons.inventory.schemas import ProductResponse
from app.core.db import get_session
from app.core.rbac import Permission, RBACGuard


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


@router.get("/products", response_model=list[ProductResponse])
async def list_products_route(
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUserResponse = Depends(
        RBACGuard(Permission.PRODUCT_READ)
    ),
    session: AsyncSession = Depends(get_session),
) -> list[ProductResponse]:
    products = await service.list_products(
        session=session,
        organization_id=current_user.organization_id,
        limit=limit,
        offset=offset,
    )

    return [
        ProductResponse.model_validate(product)
        for product in products
    ]


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product_route(
    product_id: UUID,
    current_user: CurrentUserResponse = Depends(
        RBACGuard(Permission.PRODUCT_READ)
    ),
    session: AsyncSession = Depends(get_session),
) -> ProductResponse:
    product = await service.get_product(
        session=session,
        organization_id=current_user.organization_id,
        product_id=product_id,
    )

    return ProductResponse.model_validate(product)