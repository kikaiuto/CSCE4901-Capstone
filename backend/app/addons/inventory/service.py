"""Business logic for inventory operations."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.inventory import repository
from app.addons.inventory.models import Product


async def list_products(
    session: AsyncSession,
    organization_id: UUID,
    limit: int = 100,
    offset: int = 0,
) -> list[Product]:
    return await repository.list_products(
        session=session,
        organization_id=organization_id,
        limit=limit,
        offset=offset,
    )


async def get_product(
    session: AsyncSession,
    organization_id: UUID,
    product_id: UUID,
) -> Product:
    product = await repository.get_product(
        session=session,
        organization_id=organization_id,
        product_id=product_id,
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product