
"""Tenant-scoped database queries for inventory."""

from collections.abc import Collection
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.accounting.models import ChartOfAccounts
from app.addons.inventory.models import (
    InventoryLedger,
    Product,
    ProductCategory,
    StockReservation,
)


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


async def get_products(
    session: AsyncSession,
    organization_id: UUID,
    product_ids: Collection[UUID],
    lock: bool = False,
) -> dict[UUID, Product]:
    """Products by id. lock=True takes SELECT ... FOR UPDATE in product_id order, so
    two writers touching overlapping products always queue rather than deadlock."""

    statement = (
        select(Product)
        .where(
            Product.organization_id == organization_id,
            Product.product_id.in_(list(product_ids)),
        )
        .order_by(Product.product_id)
    )
    if lock:
        # populate_existing: a locked read must not hand back a stale identity-map row.
        statement = statement.with_for_update().execution_options(populate_existing=True)

    result = await session.scalars(statement)
    return {product.product_id: product for product in result.all()}


async def on_hand_by_product(
    session: AsyncSession,
    organization_id: UUID,
    product_ids: Collection[UUID],
) -> dict[UUID, int]:
    statement = (
        select(InventoryLedger.product_id, func.sum(InventoryLedger.change_quantity))
        .where(
            InventoryLedger.organization_id == organization_id,
            InventoryLedger.product_id.in_(list(product_ids)),
        )
        .group_by(InventoryLedger.product_id)
    )

    result = await session.execute(statement)
    return {product_id: int(total) for product_id, total in result.all()}


async def committed_by_product(
    session: AsyncSession,
    organization_id: UUID,
    product_ids: Collection[UUID],
) -> dict[UUID, int]:
    statement = (
        select(StockReservation.product_id, func.sum(StockReservation.change_quantity))
        .where(
            StockReservation.organization_id == organization_id,
            StockReservation.product_id.in_(list(product_ids)),
        )
        .group_by(StockReservation.product_id)
    )

    result = await session.execute(statement)
    return {product_id: int(total) for product_id, total in result.all()}


async def reserved_for_document(
    session: AsyncSession,
    organization_id: UUID,
    document_kind: str,
    document_id: UUID,
) -> dict[UUID, int] | None:
    """The document's outstanding reservation per product, or None if it never
    reserved anything."""

    statement = (
        select(StockReservation.product_id, func.sum(StockReservation.change_quantity))
        .where(
            StockReservation.organization_id == organization_id,
            StockReservation.document_kind == document_kind,
            StockReservation.document_id == document_id,
        )
        .group_by(StockReservation.product_id)
        .order_by(StockReservation.product_id)
    )

    rows = (await session.execute(statement)).all()
    if not rows:
        return None
    return {product_id: int(total) for product_id, total in rows}


async def list_ledger(
    session: AsyncSession,
    organization_id: UUID,
    product_id: UUID,
    limit: int,
) -> list[InventoryLedger]:
    statement = (
        select(InventoryLedger)
        .where(
            InventoryLedger.organization_id == organization_id,
            InventoryLedger.product_id == product_id,
        )
        .order_by(InventoryLedger.created_at.desc(), InventoryLedger.ledger_id.desc())
        .limit(limit)
    )

    result = await session.scalars(statement)
    return list(result.all())


async def append(
    session: AsyncSession,
    rows: Collection[InventoryLedger | StockReservation],
) -> None:
    """The only write path for ledger and reservation rows: insert, never update."""

    session.add_all(rows)
    await session.flush()
