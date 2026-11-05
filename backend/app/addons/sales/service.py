"""Customers, sales orders, and the order state machine.

SalesService implements SalesContract. It reaches inventory and accounting only
through provide(InventoryContract) and provide(AccountingContract), resolved on
the request's session when a transition needs them, so every write in a confirm
or fulfil shares the request's one transaction. Nothing here commits.

Features: F3, F6, F7. Requirements: R5, R6, R13, R14, R15.
"""

from collections.abc import Sequence
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.sales import repository
from app.addons.sales.models import Customer, SalesOrder, SalesOrderLine
from app.addons.sales.schemas import CustomerIn
from app.core.contracts import provide
from app.core.contracts.accounting import AccountingContract, SaleDocument, SaleLine
from app.core.contracts.common import DocumentKind, DocumentRef
from app.core.contracts.inventory import InventoryContract, StockLine
from app.core.contracts.sales import (
    ORDER_TRANSITIONS,
    InvalidTransition,
    Order,
    OrderDraft,
    OrderLine,
    OrderStatus,
)
from app.core.errors import AppError, NotFound
from app.core.tenancy import TenantContext

CENT = Decimal("0.01")
# ponytail: one flat rate for every tenant; a per-organization rate needs a column.
TAX_RATE = Decimal("0.0825")


class UnknownReference(AppError):
    """A customer or product id that is not in the caller's organization."""

    status_code = 422
    code = "unknown_reference"

    def __init__(self, field: str) -> None:
        super().__init__(f"{field} not found")
        self.field = field

    def details(self) -> dict[str, str]:
        return {"field": self.field}


def money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def document(order_id: UUID) -> DocumentRef:
    """The order as inventory and accounting name it. Derived from the id because
    sales_orders has no number column yet."""
    return DocumentRef(DocumentKind.SALES_ORDER, order_id, f"SO-{order_id.hex[:8].upper()}")


def _order(row: SalesOrder, lines: Sequence[SalesOrderLine]) -> Order:
    return Order(
        order_id=row.order_id,
        customer_id=row.customer_id,
        status=OrderStatus(row.status),
        created_at=row.created_at,
        lines=tuple(OrderLine(x.line_id, x.product_id, x.quantity, x.line_total) for x in lines),
        order_total=row.order_total,
    )


async def list_customers(session: AsyncSession, ctx: TenantContext) -> list[Customer]:
    return await repository.list_customers(session, ctx.organization_id)


async def get_customer(session: AsyncSession, ctx: TenantContext, customer_id: UUID) -> Customer:
    customer = await repository.get_customer(session, ctx.organization_id, customer_id)
    if customer is None:
        raise NotFound("Customer not found")
    return customer


async def create_customer(session: AsyncSession, ctx: TenantContext, body: CustomerIn) -> Customer:
    customer = Customer(
        customer_id=uuid4(),
        organization_id=ctx.organization_id,
        name=body.name,
        contact_details=body.contact_details,
        credit_status="GOOD",
    )
    await repository.add(session, customer)
    return customer


class SalesService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _inventory(self) -> InventoryContract:
        return provide(InventoryContract)(self.session)

    def _accounting(self) -> AccountingContract:
        return provide(AccountingContract)(self.session)

    async def _lines(self, ctx: TenantContext, order_id: UUID) -> list[SalesOrderLine]:
        return await repository.lines_for(self.session, ctx.organization_id, [order_id])

    async def get_order(self, ctx: TenantContext, order_id: UUID) -> Order:
        row = await repository.get_order(self.session, ctx.organization_id, order_id)
        if row is None:
            raise NotFound("Order not found")
        return _order(row, await self._lines(ctx, order_id))

    async def list_orders(
        self, ctx: TenantContext, status: OrderStatus | None = None
    ) -> Sequence[Order]:
        rows = await repository.list_orders(
            self.session, ctx.organization_id, status.value if status else None
        )
        lines = await repository.lines_for(
            self.session, ctx.organization_id, [r.order_id for r in rows]
        )
        by_order: dict[UUID, list[SalesOrderLine]] = {r.order_id: [] for r in rows}
        for line in lines:
            by_order[line.order_id].append(line)
        return [_order(r, by_order[r.order_id]) for r in rows]

    async def create_order(self, ctx: TenantContext, draft: OrderDraft) -> Order:
        """Prices every line from products.unit_price, never from the draft, so a
        caller cannot set its own price; draft unit_price is not read (R13)."""
        org = ctx.organization_id
        if await repository.get_customer(self.session, org, draft.customer_id) is None:
            raise UnknownReference("customer_id")
        prices = await repository.product_prices(
            self.session, org, {x.product_id for x in draft.lines}
        )
        for i, x in enumerate(draft.lines):
            if x.product_id not in prices:
                raise UnknownReference(f"lines[{i}].product_id")

        order = SalesOrder(
            order_id=uuid4(),
            organization_id=org,
            customer_id=draft.customer_id,
            status=OrderStatus.DRAFT.value,
            created_at=datetime.now(UTC),
        )
        lines = [
            SalesOrderLine(
                line_id=uuid4(),
                organization_id=org,
                order_id=order.order_id,
                product_id=x.product_id,
                quantity=x.quantity,
                line_total=money(prices[x.product_id] * x.quantity),
            )
            for x in draft.lines
        ]
        subtotal = sum((x.line_total for x in lines), Decimal("0.00"))
        order.order_total = subtotal + money(subtotal * TAX_RATE)
        await repository.add(self.session, order)
        await repository.add(self.session, *lines)
        return _order(order, lines)

    async def transition_order_status(
        self, ctx: TenantContext, order_id: UUID, to: OrderStatus
    ) -> Order:
        row = await repository.get_order(self.session, ctx.organization_id, order_id, lock=True)
        if row is None:
            raise NotFound("Order not found")
        current = OrderStatus(row.status)
        if to not in ORDER_TRANSITIONS[current]:
            raise InvalidTransition(current, to)

        lines = await self._lines(ctx, order_id)
        doc = document(order_id)
        if to is OrderStatus.CONFIRMED:
            # Raises InsufficientStock before the status changes; the request rolls back.
            await self._inventory().reserve(
                ctx, doc, [StockLine(x.product_id, x.quantity) for x in lines]
            )
        elif to is OrderStatus.CANCELLED and current is OrderStatus.CONFIRMED:
            await self._inventory().release(ctx, doc)
        elif to is OrderStatus.FULFILLED:
            shipped = await self._inventory().ship(ctx, doc)
            # Cost per product from the SALE_SHIP rows, never our own arithmetic.
            costs = {r.product_id: r.unit_cost for r in shipped}
            subtotal = sum((x.line_total for x in lines), Decimal("0.00"))
            await self._accounting().post_sale(
                ctx,
                SaleDocument(
                    document=doc,
                    lines=[
                        SaleLine(
                            x.product_id,
                            x.quantity,
                            x.line_total / x.quantity,
                            costs[x.product_id],
                        )
                        for x in lines
                    ],
                    tax=row.order_total - subtotal,
                ),
            )

        row.status = to.value
        await repository.flush(self.session)
        return _order(row, lines)
