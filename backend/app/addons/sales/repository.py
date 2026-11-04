"""Tenant-scoped data access for the sales addon.

Features: F3, F6, F7. Requirements: R5, R6, R13, R14, R15.
"""

from collections.abc import Collection
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.inventory.models import Product
from app.addons.sales.models import Customer, SalesOrder, SalesOrderLine


async def list_customers(session: AsyncSession, organization_id: UUID) -> list[Customer]:
    statement = (
        select(Customer).where(Customer.organization_id == organization_id).order_by(Customer.name)
    )
    return list((await session.scalars(statement)).all())


async def get_customer(
    session: AsyncSession, organization_id: UUID, customer_id: UUID
) -> Customer | None:
    statement = select(Customer).where(
        Customer.organization_id == organization_id, Customer.customer_id == customer_id
    )
    return (await session.scalars(statement)).one_or_none()


async def add(session: AsyncSession, *rows: object) -> None:
    session.add_all(rows)
    await session.flush()


async def product_prices(
    session: AsyncSession, organization_id: UUID, product_ids: Collection[UUID]
) -> dict[UUID, Decimal]:
    statement = select(Product.product_id, Product.unit_price).where(
        Product.organization_id == organization_id, Product.product_id.in_(product_ids)
    )
    return {row[0]: row[1] for row in (await session.execute(statement)).all()}


async def get_order(
    session: AsyncSession, organization_id: UUID, order_id: UUID, *, lock: bool = False
) -> SalesOrder | None:
    statement = select(SalesOrder).where(
        SalesOrder.organization_id == organization_id, SalesOrder.order_id == order_id
    )
    if lock:
        # Two concurrent transitions of one order serialize here.
        statement = statement.with_for_update()
    return (await session.scalars(statement)).one_or_none()


async def list_orders(
    session: AsyncSession, organization_id: UUID, status: str | None = None
) -> list[SalesOrder]:
    statement = (
        select(SalesOrder)
        .where(SalesOrder.organization_id == organization_id)
        .order_by(SalesOrder.created_at.desc())
    )
    if status is not None:
        statement = statement.where(SalesOrder.status == status)
    return list((await session.scalars(statement)).all())


async def lines_for(
    session: AsyncSession, organization_id: UUID, order_ids: Collection[UUID]
) -> list[SalesOrderLine]:
    statement = select(SalesOrderLine).where(
        SalesOrderLine.organization_id == organization_id,
        SalesOrderLine.order_id.in_(order_ids),
    )
    return list((await session.scalars(statement)).all())


async def flush(session: AsyncSession) -> None:
    await session.flush()
