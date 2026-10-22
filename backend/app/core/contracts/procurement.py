"""Procurement contract.

Purchase order state and record_goods_receipt, which writes ledger rows through
the inventory contract and posts through the accounting contract.

Open question, recorded in docs/requirements/traceability.md: F8 and R15 also
name a Paid state that the design and screens do not have. PO_TRANSITIONS is
the four-state machine the design uses; adding Paid is a team decision.

ProcurementReader is the read-only facet; ai and home may only use readers.

Owned by: procurement (INV track). Called by: inventory (incoming quantities on
S-05), home (Receive queue rows), ai (drafts only, through S-08 "Open as draft").

Features: F8, F9. Requirements: R16, R17.
"""

import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Protocol, runtime_checkable

from app.core.tenancy import TenantContext


class PurchaseOrderStatus(StrEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    RECEIVED = "received"
    CANCELLED = "cancelled"


PO_TRANSITIONS: dict[PurchaseOrderStatus, frozenset[PurchaseOrderStatus]] = {
    PurchaseOrderStatus.DRAFT: frozenset(
        {PurchaseOrderStatus.SUBMITTED, PurchaseOrderStatus.CANCELLED}
    ),
    PurchaseOrderStatus.SUBMITTED: frozenset(
        {PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CANCELLED}
    ),
    PurchaseOrderStatus.RECEIVED: frozenset(),
    PurchaseOrderStatus.CANCELLED: frozenset(),
}


@dataclass(frozen=True, slots=True)
class PurchaseOrderLine:
    line_id: uuid.UUID
    product_id: uuid.UUID
    quantity_ordered: int
    quantity_received: int
    unit_cost: Decimal
    """NUMERIC(12, 4)."""


@dataclass(frozen=True, slots=True)
class PurchaseOrder:
    po_id: uuid.UUID
    number: str
    """Human number shown on S-06, e.g. PO-0214."""
    supplier_id: uuid.UUID
    status: PurchaseOrderStatus
    expected_date: date | None
    lines: Sequence[PurchaseOrderLine]
    total: Decimal


@dataclass(frozen=True, slots=True)
class ReceiptQuantity:
    line_id: uuid.UUID
    quantity: int


@dataclass(frozen=True, slots=True)
class IncomingQuantity:
    """One open PO line for a product: S-05's "Incoming" and open documents list."""

    po_id: uuid.UUID
    number: str
    expected_date: date | None
    quantity_outstanding: int


@runtime_checkable
class ProcurementReader(Protocol):
    async def get_purchase_order(self, ctx: TenantContext, po_id: uuid.UUID) -> PurchaseOrder: ...

    async def incoming_for_products(
        self, ctx: TenantContext, product_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, Sequence[IncomingQuantity]]: ...


@runtime_checkable
class ProcurementContract(ProcurementReader, Protocol):
    """Writers. Each one flushes and leaves the commit to the request."""

    async def record_goods_receipt(
        self, ctx: TenantContext, po_id: uuid.UUID, quantities: Sequence[ReceiptQuantity]
    ) -> PurchaseOrder:
        """Partial receipts leave the PO SUBMITTED with the rest outstanding (S-06
        note 2); the last unit received moves it to RECEIVED. Writes RECEIPT
        ledger rows through InventoryContract.receive and one entry through
        AccountingContract.post_receipt, in one transaction."""
        ...
