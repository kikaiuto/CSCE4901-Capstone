"""Tenant-scoped database queries for inventory."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.inventory.models import Product


async def list_products(
    session: AsyncSession,
    organization_id: UUID,
    limit: int = 100,
    offset: int = 0,
) -> list[Product]:
    statement = (
        select(Product)
        .where(Product.organization_id == organization_id)
        .order_by(Product.sku, Product.product_id)
        .limit(limit)
        .offset(offset)
    )

    result = await session.scalars(statement)
    return list(result.all())


async def get_product(
    session: AsyncSession,
    organization_id: UUID,
    product_id: UUID,
) -> Product | None:
    statement = select(Product).where(
        Product.organization_id == organization_id,
        Product.product_id == product_id,
    )

    return await session.scalar(statement)