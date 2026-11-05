"""Pydantic V2 request and response schemas for the procurement addon.

Money serializes as strings. No request carries a total: the server computes them.

Features: F8, F9. Requirements: R16, R17.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.contracts.procurement import PurchaseOrderStatus

# NUMERIC(12, 4) holds at most 8 integer digits.
MAX_UNIT_COST = Decimal("100000000")


class SupplierIn(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    supplier_terms: str | None = Field(default=None, max_length=500)
    lead_time_days: int | None = Field(default=None, ge=0)


class SupplierOut(BaseModel):
    supplier_id: UUID
    name: str
    supplier_terms: str | None
    lead_time_days: int | None


class PurchaseOrderLineIn(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)
    unit_cost: Decimal = Field(ge=0, lt=MAX_UNIT_COST, decimal_places=4)


class PurchaseOrderIn(BaseModel):
    supplier_id: UUID
    lines: list[PurchaseOrderLineIn] = Field(min_length=1, max_length=500)


class PurchaseOrderLineOut(BaseModel):
    line_id: UUID
    product_id: UUID
    quantity: int
    quantity_received: int
    unit_cost: Decimal
    line_total: Decimal


class PurchaseOrderOut(BaseModel):
    po_id: UUID
    number: str
    supplier_id: UUID
    status: PurchaseOrderStatus
    created_at: datetime
    lines: list[PurchaseOrderLineOut]
    total: Decimal


class ReceiptLineIn(BaseModel):
    line_id: UUID
    quantity: int = Field(gt=0)


class ReceiptIn(BaseModel):
    lines: list[ReceiptLineIn] = Field(min_length=1, max_length=500)


class JournalLineOut(BaseModel):
    account_id: UUID
    debit: Decimal
    credit: Decimal
    memo: str


class AverageCostOut(BaseModel):
    line_id: UUID
    product_id: UUID
    quantity: int
    unit_cost: Decimal
    average_cost_after: Decimal


class ReceiptPreviewOut(BaseModel):
    """S-06 action bar: the entry receiving everything outstanding would post, and
    each product's moving average cost after it (S2-INV-04)."""

    journal_lines: list[JournalLineOut]
    average_costs: list[AverageCostOut]
