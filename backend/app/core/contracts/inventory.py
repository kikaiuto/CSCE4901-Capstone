"""Inventory contract.

Reserve and release under pessimistic row locks so two confirmations can never
oversell the same unit, append-only ledger writes carrying resulting_on_hand,
and moving average cost recalculated on each goods receipt.

InventoryReader is the read-only facet. ai and home may only use readers;
tests/architecture/test_contracts.py enforces it.

Owned by: inventory (INV). Called by: sales (reserve, release, ship), procurement
(receive), accounting (product accounts), forecasting and ai (reader only).

Features: F4, F5, F6, F9. Requirements: R7, R8, R9, R10, R11, R12.
"""

import uuid
from collections.abc import Collection, Mapping, Sequence
from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum
from typing import Any, Protocol, runtime_checkable

from app.core.contracts.common import DocumentRef
from app.core.errors import Conflict
from app.core.tenancy import TenantContext


class MovementKind(StrEnum):
    RECEIPT = "receipt"
    SALE_SHIP = "sale_ship"
    ADJUSTMENT = "adjustment"
    RETURN = "return"


@dataclass(frozen=True, slots=True)
class StockLine:
    product_id: uuid.UUID
    quantity: int


@dataclass(frozen=True, slots=True)
class StockLevel:
    """The four quantities on S-05, plus cost to four decimals."""

    product_id: uuid.UUID
    on_hand: int
    committed: int
    available: int
    incoming: int
    moving_average_cost: Decimal


@dataclass(frozen=True, slots=True)
class ReceivedLine:
    product_id: uuid.UUID
    quantity: int
    unit_cost: Decimal
    """The PO unit cost, NUMERIC(12, 4). Drives the moving average (R17)."""


@dataclass(frozen=True, slots=True)
class AdjustmentLine:
    product_id: uuid.UUID
    change_quantity: int
    """Signed: negative for shrinkage, positive for a found count."""


@dataclass(frozen=True, slots=True)
class LedgerRow:
    ledger_id: uuid.UUID
    product_id: uuid.UUID
    change_quantity: int
    resulting_on_hand: int
    unit_cost: Decimal
    """Moving average cost the row moved at: after recalculation for a RECEIPT,
    the cost that left stock for SALE_SHIP and ADJUSTMENT. COGS uses it."""
    kind: MovementKind
    document: DocumentRef
    actor_id: uuid.UUID


@dataclass(frozen=True, slots=True)
class ProductAccounts:
    """Where a product's postings go (D-02: asset and revenue account links)."""

    product_id: uuid.UUID
    asset_account_id: uuid.UUID
    revenue_account_id: uuid.UUID


@dataclass(frozen=True, slots=True)
class Shortage:
    product_id: uuid.UUID
    requested: int
    available: int


class InsufficientStock(Conflict):
    """409 with nothing written (R12). Carries every short line, so S-04 can show
    each problem inline and offer "Split into backorder"."""

    code = "insufficient_stock"

    def __init__(self, shortages: Sequence[Shortage]) -> None:
        super().__init__(f"{len(shortages)} line(s) short on stock")
        self.shortages = tuple(shortages)

    def details(self) -> dict[str, Any]:
        return {
            "shortages": [
                {"product_id": str(s.product_id), "requested": s.requested,
                 "available": s.available}
                for s in self.shortages
            ]
        }


@runtime_checkable
class InventoryReader(Protocol):
    async def get_stock(
        self, ctx: TenantContext, product_ids: Collection[uuid.UUID]
    ) -> Mapping[uuid.UUID, StockLevel]:
        ...

    async def get_ledger(
        self, ctx: TenantContext, product_id: uuid.UUID, limit: int = 50
    ) -> Sequence[LedgerRow]:
        """Newest first. The S-05 stock ledger and step chart."""
        ...

    async def get_product_accounts(
        self, ctx: TenantContext, product_ids: Collection[uuid.UUID]
    ) -> Mapping[uuid.UUID, ProductAccounts]:
        ...

    async def preview_average_cost(
        self, ctx: TenantContext, product_id: uuid.UUID, received_qty: int, unit_cost: Decimal
    ) -> Decimal:
        """The S-06 "avg cost before -> after" figure, without writing anything.
        ((on_hand * current_cost) + (received_qty * unit_cost)) / (on_hand +
        received_qty), quantized to NUMERIC(12, 4). Requirement: R17."""
        ...


@runtime_checkable
class InventoryContract(InventoryReader, Protocol):
    """Writers. Every method appends ledger rows and never edits one; a correction
    is a new ADJUSTMENT. Each one flushes and leaves the commit to the request."""

    async def reserve(
        self, ctx: TenantContext, document: DocumentRef, lines: Sequence[StockLine]
    ) -> None:
        """Lock every product row (SELECT ... FOR UPDATE), check available stock,
        and commit the quantities against the document. All lines or none:
        raises InsufficientStock with every short line and writes nothing."""
        ...

    async def release(self, ctx: TenantContext, document: DocumentRef) -> None:
        """Undo a reservation, e.g. on cancel. Releasing twice is a no-op; a
        document that never reserved raises NotFound."""
        ...

    async def ship(self, ctx: TenantContext, document: DocumentRef) -> Sequence[LedgerRow]:
        """Consume the document's reservation: one SALE_SHIP row per line, on hand
        reduced, each row carrying the moving average cost it left at. Sales
        builds the COGS lines for AccountingContract.post_sale from these rows."""
        ...

    async def receive(
        self, ctx: TenantContext, document: DocumentRef, lines: Sequence[ReceivedLine]
    ) -> Sequence[LedgerRow]:
        """One RECEIPT row per line and a moving average recalculation (R16, R17)."""
        ...

    async def adjust(
        self, ctx: TenantContext, document: DocumentRef, reason: str,
        lines: Sequence[AdjustmentLine],
    ) -> Sequence[LedgerRow]:
        """S-05 "Adjust". A reason is required (S-05 note 3)."""
        ...
