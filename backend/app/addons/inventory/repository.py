"""Tenant-scoped database queries for inventory."""

from collections.abc import Collection
from decimal import Decimal
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
    """Retrieve products by ID.

    lock=True uses SELECT ... FOR UPDATE in product ID order,
    allowing concurrent writers to queue instead of deadlocking.
    """

    statement = (
        select(Product)
        .where(
            Product.organization_id == organization_id,
            Product.product_id.in_(list(product_ids)),
        )
        .order_by(Product.product_id)
    )

    if lock:
        # A locked read must not return a stale identity-map row.
        statement = statement.with_for_update().execution_options(populate_existing=True)

    result = await session.scalars(statement)
    return {product.product_id: product for product in result.all()}


async def on_hand_by_product(
    session: AsyncSession,
    organization_id: UUID,
    product_ids: Collection[UUID],
) -> dict[UUID, int]:
    statement = (
        select(
            InventoryLedger.product_id,
            func.sum(InventoryLedger.change_quantity),
        )
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
        select(
            StockReservation.product_id,
            func.sum(StockReservation.change_quantity),
        )
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
    """Return outstanding reservations for a document.

    Returns None if the document never reserved any inventory.
    """

    statement = (
        select(
            StockReservation.product_id,
            func.sum(StockReservation.change_quantity),
        )
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
        .order_by(
            InventoryLedger.created_at.desc(),
            InventoryLedger.ledger_id.desc(),
        )
        .limit(limit)
    )

    result = await session.scalars(statement)
    return list(result.all())


async def append(
    session: AsyncSession,
    rows: Collection[InventoryLedger | StockReservation],
) -> None:
    """Append inventory ledger or reservation rows.

    Existing ledger and reservation records are never modified.
    """

    session.add_all(rows)
    await session.flush()


# --------------------------------------------------
# ERP DASHBOARD - INVENTORY DATA AGGREGATION
# --------------------------------------------------


async def inventory_dashboard_rows(
    session: AsyncSession,
    organization_id: UUID,
) -> list[tuple[int, Decimal, int, int]]:
    """Retrieve tenant-scoped inventory data for dashboard calculations.

    Each returned tuple contains:

    1. Safety stock threshold.
    2. Moving average cost.
    3. On-hand quantity.
    4. Committed quantity.

    Stock quantities are calculated using grouped SQL queries.

    Products without ledger or reservation records are included
    with zero quantities.

    This function performs read-only database operations.
    """

    # --------------------------------------------------
    # 1. AGGREGATE ON-HAND STOCK
    # --------------------------------------------------

    on_hand = (
        select(
            InventoryLedger.product_id,
            func.sum(InventoryLedger.change_quantity).label("quantity"),
        )
        .where(
            InventoryLedger.organization_id == organization_id,
        )
        .group_by(
            InventoryLedger.product_id,
        )
        .subquery()
    )

    # --------------------------------------------------
    # 2. AGGREGATE COMMITTED STOCK
    # --------------------------------------------------

    committed = (
        select(
            StockReservation.product_id,
            func.sum(StockReservation.change_quantity).label("quantity"),
        )
        .where(
            StockReservation.organization_id == organization_id,
        )
        .group_by(
            StockReservation.product_id,
        )
        .subquery()
    )

    # --------------------------------------------------
    # 3. RETRIEVE PRODUCTS AND INVENTORY BALANCES
    # --------------------------------------------------

    statement = (
        select(
            Product.safety_stock_threshold,
            Product.average_cost,
            func.coalesce(
                on_hand.c.quantity,
                0,
            ),
            func.coalesce(
                committed.c.quantity,
                0,
            ),
        )
        .select_from(Product)
        .outerjoin(
            on_hand,
            on_hand.c.product_id == Product.product_id,
        )
        .outerjoin(
            committed,
            committed.c.product_id == Product.product_id,
        )
        .where(
            Product.organization_id == organization_id,
        )
    )

    # --------------------------------------------------
    # 4. EXECUTE THE READ-ONLY QUERY
    # --------------------------------------------------

    result = await session.execute(statement)

    # --------------------------------------------------
    # 5. RETURN VALIDATED PYTHON VALUES
    # --------------------------------------------------

    return [
        (
            int(threshold),
            Decimal(average_cost),
            int(on_hand_quantity),
            int(committed_quantity),
        )
        for (
            threshold,
            average_cost,
            on_hand_quantity,
            committed_quantity,
        ) in result.all()
    ]
