"""Data access queries for the procurement addon.

Features: F8, F9. Requirements: R16, R17.
"""

from collections.abc import Collection
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.procurement.models import PurchaseOrder, PurchaseOrderLine, Supplier
from app.core.contracts.procurement import PurchaseOrderStatus

OPEN = (PurchaseOrderStatus.SUBMITTED, PurchaseOrderStatus.PARTIALLY_RECEIVED)


async def list_suppliers(session: AsyncSession, organization_id: UUID) -> list[Supplier]:
    statement = (
        select(Supplier).where(Supplier.organization_id == organization_id).order_by(Supplier.name)
    )
    return list((await session.scalars(statement)).all())


async def get_supplier(
    session: AsyncSession, organization_id: UUID, supplier_id: UUID
) -> Supplier | None:
    statement = select(Supplier).where(
        Supplier.organization_id == organization_id, Supplier.supplier_id == supplier_id
    )
    return await session.scalar(statement)


async def list_purchase_orders(session: AsyncSession, organization_id: UUID) -> list[PurchaseOrder]:
    statement = (
        select(PurchaseOrder)
        .where(PurchaseOrder.organization_id == organization_id)
        .order_by(PurchaseOrder.created_at.desc())
    )
    return list((await session.scalars(statement)).all())


async def get_purchase_order(
    session: AsyncSession, organization_id: UUID, po_id: UUID, *, for_update: bool = False
) -> PurchaseOrder | None:
    """for_update locks the PO row, so two receipts against it run one at a time."""
    statement = select(PurchaseOrder).where(
        PurchaseOrder.organization_id == organization_id, PurchaseOrder.po_id == po_id
    )
    if for_update:
        statement = statement.with_for_update()
    return await session.scalar(statement)


async def lines_for(
    session: AsyncSession, organization_id: UUID, po_ids: Collection[UUID]
) -> list[PurchaseOrderLine]:
    statement = (
        select(PurchaseOrderLine)
        .where(
            PurchaseOrderLine.organization_id == organization_id,
            PurchaseOrderLine.po_id.in_(po_ids),
        )
        .order_by(PurchaseOrderLine.line_id)
    )
    return list((await session.scalars(statement)).all())


async def open_lines_for_products(
    session: AsyncSession, organization_id: UUID, product_ids: Collection[UUID]
) -> list[PurchaseOrderLine]:
    statement = (
        select(PurchaseOrderLine)
        .join(
            PurchaseOrder,
            (PurchaseOrder.organization_id == PurchaseOrderLine.organization_id)
            & (PurchaseOrder.po_id == PurchaseOrderLine.po_id),
        )
        .where(
            PurchaseOrderLine.organization_id == organization_id,
            PurchaseOrderLine.product_id.in_(product_ids),
            PurchaseOrderLine.quantity_received < PurchaseOrderLine.quantity,
            PurchaseOrder.status.in_(OPEN),
        )
        .order_by(PurchaseOrder.created_at)
    )
    return list((await session.scalars(statement)).all())


async def add(session: AsyncSession, *rows: object) -> None:
    session.add_all(rows)
    await session.flush()
