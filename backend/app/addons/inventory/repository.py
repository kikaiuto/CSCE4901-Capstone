
"""Tenant-scoped database queries for inventory."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.accounting.models import ChartOfAccounts
from app.addons.inventory.models import Product, ProductCategory


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


async def get_category(
    session: AsyncSession,
    organization_id: UUID,
    category_id: UUID,
) -> ProductCategory | None:
    statement = select(ProductCategory).where(
        ProductCategory.organization_id == organization_id,
        ProductCategory.category_id == category_id,
    )

    return await session.scalar(statement)


async def get_account(
    session: AsyncSession,
    organization_id: UUID,
    account_id: UUID,
) -> ChartOfAccounts | None:
    statement = select(ChartOfAccounts).where(
        ChartOfAccounts.organization_id == organization_id,
        ChartOfAccounts.account_id == account_id,
    )

    return await session.scalar(statement)


async def sku_exists(
    session: AsyncSession,
    organization_id: UUID,
    sku: str,
) -> bool:
    statement = select(Product.product_id).where(
        Product.organization_id == organization_id,
        Product.sku == sku,
    )

    product_id = await session.scalar(statement)
    return product_id is not None


async def create_product(
    session: AsyncSession,
    product: Product,
) -> Product:
    session.add(product)
    await session.flush()
    return product
