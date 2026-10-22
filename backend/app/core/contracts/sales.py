"""Sales contract.

The sales order state machine: Draft, Confirmed, Fulfilled, Cancelled.
transition_order_status is the only way an order changes state, and it runs
one order at a time on the server even when the UI offers a bulk action.

Open question, recorded in docs/requirements/traceability.md: F7 and R14 also
name a Closed state that the design and screens do not have. ORDER_TRANSITIONS
is the four-state machine the design uses; adding Closed is a team decision and a
change to this file.

SalesReader is the read-only facet; ai and home may only use readers.

Owned by: sales (SLS). Called by: home (queue rows), ai (reader only).

Features: F6, F7. Requirements: R13, R14, R15.
"""

import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Any, Protocol, runtime_checkable

from app.core.errors import Conflict
from app.core.tenancy import TenantContext


class OrderStatus(StrEnum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"


ORDER_TRANSITIONS: dict[OrderStatus, frozenset[OrderStatus]] = {
    OrderStatus.DRAFT: frozenset({OrderStatus.CONFIRMED, OrderStatus.CANCELLED}),
    OrderStatus.CONFIRMED: frozenset({OrderStatus.FULFILLED, OrderStatus.CANCELLED}),
    OrderStatus.FULFILLED: frozenset(),
    OrderStatus.CANCELLED: frozenset(),
}


@dataclass(frozen=True, slots=True)
class OrderLineDraft:
    """No line_total: the server computes it (R13). Client totals are never read."""

    product_id: uuid.UUID
    quantity: int
    unit_price: Decimal


@dataclass(frozen=True, slots=True)
class OrderDraft:
    customer_id: uuid.UUID
    order_date: date
    lines: Sequence[OrderLineDraft]


@dataclass(frozen=True, slots=True)
class OrderLine:
    line_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    line_total: Decimal


@dataclass(frozen=True, slots=True)
class Order:
    order_id: uuid.UUID
    number: str
    """Human number shown on S-03, e.g. SO-1044."""
    customer_id: uuid.UUID
    owner_id: uuid.UUID
    order_date: date
    status: OrderStatus
    lines: Sequence[OrderLine]
    subtotal: Decimal
    tax: Decimal
    total: Decimal


class InvalidTransition(Conflict):
    code = "invalid_transition"

    def __init__(self, current: OrderStatus, requested: OrderStatus) -> None:
        super().__init__(f"An order in {current} cannot move to {requested}")
        self.current = current
        self.requested = requested

    def details(self) -> dict[str, Any]:
        return {
            "current": self.current.value,
            "requested": self.requested.value,
            "allowed": sorted(s.value for s in ORDER_TRANSITIONS[self.current]),
        }


@runtime_checkable
class SalesReader(Protocol):
    async def get_order(self, ctx: TenantContext, order_id: uuid.UUID) -> Order:
        """Raises NotFound for an id in another organization, same as a missing id."""
        ...

    async def list_orders(
        self, ctx: TenantContext, status: OrderStatus | None = None
    ) -> Sequence[Order]: ...


@runtime_checkable
class SalesContract(SalesReader, Protocol):
    """Writers. Each one flushes and leaves the commit to the request."""

    async def create_order(self, ctx: TenantContext, draft: OrderDraft) -> Order:
        """Creates a DRAFT order owned by ctx.user_id, totals computed here."""
        ...

    async def transition_order_status(
        self, ctx: TenantContext, order_id: uuid.UUID, to: OrderStatus
    ) -> Order:
        """Raises InvalidTransition for any move ORDER_TRANSITIONS does not allow.
        DRAFT -> CONFIRMED reserves stock through InventoryContract.reserve and
        propagates InsufficientStock. CONFIRMED -> FULFILLED ships through
        InventoryContract.ship and posts revenue and COGS through
        AccountingContract.post_sale, using the costs ship returned, in the same
        transaction. CONFIRMED -> CANCELLED releases the reservation."""
        ...
