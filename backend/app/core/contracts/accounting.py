"""Accounting contract.

validate_double_entry and post_entry. An entry whose debits do not equal its
credits is refused. Also the preview API the S-04 and S-06 action bars call to
show the exact journal lines before they post.

Every post_* has a preview_* that returns exactly the lines it would write, so
the "What this order will do" panel can never disagree with what posts.

AccountingReader is the read-only facet; ai and home may only use readers.

Owned by: accounting (ACC). Called by: sales (post on fulfilment, preview),
procurement (post on receipt, preview), inventory (post on adjustment), home and
ai (reader only).

Features: F10, F11, F12, F13. Requirements: R18, R19, R20, R21, R22, R23.
"""

import uuid
from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Any, Protocol, runtime_checkable

from app.core.contracts.common import DocumentRef
from app.core.errors import AppError
from app.core.tenancy import TenantContext


class AccountType(StrEnum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class EntrySource(StrEnum):
    """The Auto / Manual tag on S-07's recent entries."""

    MANUAL = "manual"
    AUTO = "auto"


@dataclass(frozen=True, slots=True)
class JournalLineDraft:
    """One side of an entry. Exactly one of debit and credit is positive and the
    other is zero (R19). Negative amounts are refused. NUMERIC(15, 2)."""

    account_id: uuid.UUID
    debit: Decimal = Decimal("0.00")
    credit: Decimal = Decimal("0.00")
    memo: str = ""


@dataclass(frozen=True, slots=True)
class JournalEntryDraft:
    entry_date: date
    memo: str
    source: EntrySource
    document: DocumentRef | None
    """None for a manual entry with no source document."""
    lines: Sequence[JournalLineDraft]


class LineProblem(StrEnum):
    BOTH_SIDES = "both_sides"
    NEITHER_SIDE = "neither_side"
    NEGATIVE = "negative"
    TOO_PRECISE = "too_precise"
    """More than two decimal places."""


@dataclass(frozen=True, slots=True)
class LineError:
    index: int
    problem: LineProblem


@dataclass(frozen=True, slots=True)
class BalanceCheck:
    """What S-07's live balance meter shows. An entry posts only when
    is_balanced is true, which needs difference == 0 and no line_errors."""

    total_debits: Decimal
    total_credits: Decimal
    difference: Decimal
    line_errors: Sequence[LineError] = field(default_factory=tuple)

    @property
    def is_balanced(self) -> bool:
        return self.difference == 0 and not self.line_errors and self.total_debits > 0


@dataclass(frozen=True, slots=True)
class PostedEntry:
    entry_id: uuid.UUID
    entry_date: date
    source: EntrySource
    document: DocumentRef | None
    lines: Sequence[JournalLineDraft]


@dataclass(frozen=True, slots=True)
class SaleLine:
    """One fulfilled order line. unit_cost comes from the SALE_SHIP ledger row
    InventoryContract.ship returned, never from the caller's own arithmetic."""

    product_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    unit_cost: Decimal


@dataclass(frozen=True, slots=True)
class SaleDocument:
    document: DocumentRef
    lines: Sequence[SaleLine]
    tax: Decimal
    """Order-level tax computed by sales (R13). Posts to Sales Tax Payable when
    non-zero, so AR equals the order total."""


@dataclass(frozen=True, slots=True)
class ReceiptLine:
    product_id: uuid.UUID
    quantity: int
    unit_cost: Decimal


@dataclass(frozen=True, slots=True)
class AdjustmentValue:
    product_id: uuid.UUID
    change_quantity: int
    unit_cost: Decimal
    """From the ADJUSTMENT ledger row."""


class UnbalancedEntry(AppError):
    status_code = 422
    code = "unbalanced_entry"

    def __init__(self, check: BalanceCheck) -> None:
        if check.line_errors:
            first = check.line_errors[0]
            message = f"Line {first.index + 1}: {first.problem.value.replace('_', ' ')}"
        else:
            message = f"Debits and credits differ by {check.difference}"
        super().__init__(message)
        self.check = check

    def details(self) -> dict[str, Any]:
        return {
            "total_debits": str(self.check.total_debits),
            "total_credits": str(self.check.total_credits),
            "difference": str(self.check.difference),
            "line_errors": [
                {"index": e.index, "problem": e.problem.value} for e in self.check.line_errors
            ],
        }


@runtime_checkable
class AccountingReader(Protocol):
    def validate_double_entry(self, lines: Sequence[JournalLineDraft]) -> BalanceCheck:
        """Pure: no session, no tenant. Reports every malformed line."""
        ...

    async def preview_sale(
        self, ctx: TenantContext, sale: SaleDocument
    ) -> Sequence[JournalLineDraft]:
        """AR Dr / Revenue Cr (+ Sales Tax Payable Cr) and COGS Dr / Inventory Cr,
        exactly as post_sale would write them (S-04 "What this order will do")."""
        ...

    async def preview_receipt(
        self, ctx: TenantContext, lines: Sequence[ReceiptLine]
    ) -> Sequence[JournalLineDraft]:
        """Inventory Dr / Accounts Payable Cr for S-06's action bar."""
        ...


@runtime_checkable
class AccountingContract(AccountingReader, Protocol):
    """Writers. Each one flushes and leaves the commit to the request."""

    async def post_entry(self, ctx: TenantContext, draft: JournalEntryDraft) -> PostedEntry:
        """The only way a journal entry is written. Raises UnbalancedEntry and
        writes nothing unless validate_double_entry says is_balanced."""
        ...

    async def post_sale(self, ctx: TenantContext, sale: SaleDocument) -> PostedEntry:
        """Revenue and COGS on fulfilment. Requirements: R20, R21."""
        ...

    async def post_receipt(
        self, ctx: TenantContext, document: DocumentRef, lines: Sequence[ReceiptLine]
    ) -> PostedEntry:
        """Requirement: R22."""
        ...

    async def post_adjustment(
        self, ctx: TenantContext, document: DocumentRef, lines: Sequence[AdjustmentValue]
    ) -> PostedEntry:
        """Inventory against an Inventory Adjustment expense account, so the GL
        inventory balance keeps matching the stock ledger after a count."""
        ...
