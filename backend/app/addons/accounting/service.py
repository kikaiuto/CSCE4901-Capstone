"""Double-entry validation and journal posting (R19), and the automatic postings
for sales, receipts, and adjustments (R20, R21, R22).

post_entry is the only way a journal entry is written; the automatic postings go
through it too, so the balance check can never be skipped.
"""

from collections import defaultdict
from collections.abc import Collection, Mapping, Sequence
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Row
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.accounting import repository
from app.addons.accounting.models import ChartOfAccounts, JournalEntry, JournalEntryLine
from app.core.contracts import provide
from app.core.contracts.accounting import (
    AdjustmentValue,
    BalanceCheck,
    EntrySource,
    JournalEntryDraft,
    JournalLineDraft,
    LineError,
    LineProblem,
    PostedEntry,
    ReceiptLine,
    SaleDocument,
    UnbalancedEntry,
)
from app.core.contracts.common import DocumentRef
from app.core.contracts.inventory import InventoryContract, ProductAccounts
from app.core.errors import AppError
from app.core.tenancy import TenantContext

CENT = Decimal("0.01")

# Accounts the automatic postings find by code. A product's inventory and revenue
# accounts come from InventoryReader.get_product_accounts instead.
ACCOUNTS_RECEIVABLE = ("1100", "Accounts Receivable")
ACCOUNTS_PAYABLE = ("2000", "Accounts Payable")
SALES_TAX_PAYABLE = ("2100", "Sales Tax Payable")
COST_OF_GOODS_SOLD = ("5000", "Cost of Goods Sold")
INVENTORY_ADJUSTMENT = ("5100", "Inventory Adjustment")


class MissingAccount(AppError):
    """An automatic posting needs an account the tenant's chart does not have."""

    status_code = 422
    code = "missing_account"

    def __init__(self, account: str) -> None:
        super().__init__(f"The chart of accounts has no {account} account")
        self.account = account

    def details(self) -> dict[str, Any]:
        return {"account": self.account}


class UnknownAccount(AppError):
    """An account_id that is not in the caller's chart of accounts."""

    status_code = 422
    code = "unknown_account"

    def __init__(self, index: int) -> None:
        super().__init__(f"Line {index + 1}: account not found")
        self.index = index

    def details(self) -> dict[str, Any]:
        return {"field": f"lines[{self.index}].account_id"}


def _problem(line: JournalLineDraft) -> LineProblem | None:
    if line.debit < 0 or line.credit < 0:
        return LineProblem.NEGATIVE
    if line.debit > 0 and line.credit > 0:
        return LineProblem.BOTH_SIDES
    if line.debit == 0 and line.credit == 0:
        return LineProblem.NEITHER_SIDE
    if line.debit != line.debit.quantize(CENT) or line.credit != line.credit.quantize(CENT):
        return LineProblem.TOO_PRECISE
    return None


def validate_double_entry(lines: Sequence[JournalLineDraft]) -> BalanceCheck:
    """Pure: no session, no tenant. Reports every malformed line."""
    errors = [LineError(i, p) for i, line in enumerate(lines) if (p := _problem(line))]
    debits = sum((line.debit for line in lines), Decimal("0.00"))
    credits = sum((line.credit for line in lines), Decimal("0.00"))
    return BalanceCheck(debits, credits, debits - credits, tuple(errors))


async def post_entry(
    session: AsyncSession, ctx: TenantContext, draft: JournalEntryDraft
) -> PostedEntry:
    """Writes the entry and its lines in the request's transaction (flush, no commit).
    Raises UnbalancedEntry and writes nothing unless the entry balances."""
    check = validate_double_entry(draft.lines)
    if not check.is_balanced:
        raise UnbalancedEntry(check)

    known = await repository.existing_account_ids(
        session, ctx.organization_id, {line.account_id for line in draft.lines}
    )
    for i, line in enumerate(draft.lines):
        if line.account_id not in known:
            raise UnknownAccount(i)

    lines = [
        JournalLineDraft(
            line.account_id, line.debit.quantize(CENT), line.credit.quantize(CENT), line.memo
        )
        for line in draft.lines
    ]
    entry = JournalEntry(
        entry_id=uuid4(),
        organization_id=ctx.organization_id,
        status="POSTED",
        entry_date=draft.entry_date,
        source=draft.source.value,
        description=draft.memo,
    )
    await repository.add_entry(
        session,
        entry,
        [
            JournalEntryLine(
                organization_id=ctx.organization_id,
                entry_id=entry.entry_id,
                account_id=line.account_id,
                debit=line.debit,
                credit=line.credit,
                memo=line.memo or None,
            )
            for line in lines
        ],
    )
    return PostedEntry(entry.entry_id, draft.entry_date, draft.source, draft.document, lines)


async def list_accounts(session: AsyncSession, organization_id: UUID) -> list[ChartOfAccounts]:
    return await repository.list_accounts(session, organization_id)


async def list_entries(session: AsyncSession, organization_id: UUID, limit: int) -> list[Row]:
    return await repository.list_entries(session, organization_id, limit)


def _money(amount: Decimal) -> Decimal:
    return amount.quantize(CENT, rounding=ROUND_HALF_UP)


class _Lines:
    """Totals per account and side, in first-seen order. Zero amounts drop out."""

    def __init__(self) -> None:
        self._amounts: defaultdict[tuple[UUID, bool], Decimal] = defaultdict(Decimal)

    def debit(self, account_id: UUID, amount: Decimal) -> None:
        self._amounts[account_id, True] += amount

    def credit(self, account_id: UUID, amount: Decimal) -> None:
        self._amounts[account_id, False] += amount

    def drafts(self) -> list[JournalLineDraft]:
        return [
            JournalLineDraft(account_id, debit=amount)
            if is_debit
            else JournalLineDraft(account_id, credit=amount)
            for (account_id, is_debit), amount in self._amounts.items()
            if amount
        ]


class AccountingService:
    """AccountingContract, bound in router.py. Each preview_* returns the lines its
    post_* writes, because both build them with the same _*_lines method."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def validate_double_entry(self, lines: Sequence[JournalLineDraft]) -> BalanceCheck:
        return validate_double_entry(lines)

    async def post_entry(self, ctx: TenantContext, draft: JournalEntryDraft) -> PostedEntry:
        return await post_entry(self.session, ctx, draft)

    async def preview_sale(
        self, ctx: TenantContext, sale: SaleDocument
    ) -> Sequence[JournalLineDraft]:
        return await self._sale_lines(ctx, sale)

    async def post_sale(self, ctx: TenantContext, sale: SaleDocument) -> PostedEntry:
        return await self._post(ctx, "Sale", sale.document, await self._sale_lines(ctx, sale))

    async def preview_receipt(
        self, ctx: TenantContext, lines: Sequence[ReceiptLine]
    ) -> Sequence[JournalLineDraft]:
        return await self._receipt_lines(ctx, lines)

    async def post_receipt(
        self, ctx: TenantContext, document: DocumentRef, lines: Sequence[ReceiptLine]
    ) -> PostedEntry:
        return await self._post(ctx, "Receipt", document, await self._receipt_lines(ctx, lines))

    async def post_adjustment(
        self, ctx: TenantContext, document: DocumentRef, lines: Sequence[AdjustmentValue]
    ) -> PostedEntry:
        return await self._post(
            ctx, "Adjustment", document, await self._adjustment_lines(ctx, lines)
        )

    async def _sale_lines(self, ctx: TenantContext, sale: SaleDocument) -> list[JournalLineDraft]:
        """AR Dr / Revenue Cr (+ Sales Tax Payable Cr), then COGS Dr / Inventory Cr."""
        tax = _money(sale.tax)
        wanted = [ACCOUNTS_RECEIVABLE, COST_OF_GOODS_SOLD] + ([SALES_TAX_PAYABLE] if tax else [])
        by_code = await self._accounts_by_code(ctx, wanted)
        products = await self._product_accounts(ctx, [x.product_id for x in sale.lines])
        revenue = [_money(x.quantity * x.unit_price) for x in sale.lines]

        lines = _Lines()
        lines.debit(by_code[ACCOUNTS_RECEIVABLE[0]], sum(revenue, tax))
        for x, amount in zip(sale.lines, revenue, strict=True):
            lines.credit(products[x.product_id].revenue_account_id, amount)
        if tax:
            lines.credit(by_code[SALES_TAX_PAYABLE[0]], tax)
        for x in sale.lines:
            cost = _money(x.quantity * x.unit_cost)
            lines.debit(by_code[COST_OF_GOODS_SOLD[0]], cost)
            lines.credit(products[x.product_id].asset_account_id, cost)
        return lines.drafts()

    async def _receipt_lines(
        self, ctx: TenantContext, receipt: Sequence[ReceiptLine]
    ) -> list[JournalLineDraft]:
        """Inventory Dr / Accounts Payable Cr."""
        by_code = await self._accounts_by_code(ctx, [ACCOUNTS_PAYABLE])
        products = await self._product_accounts(ctx, [x.product_id for x in receipt])
        lines = _Lines()
        total = Decimal("0.00")
        for x in receipt:
            cost = _money(x.quantity * x.unit_cost)
            lines.debit(products[x.product_id].asset_account_id, cost)
            total += cost
        lines.credit(by_code[ACCOUNTS_PAYABLE[0]], total)
        return lines.drafts()

    async def _adjustment_lines(
        self, ctx: TenantContext, adjustment: Sequence[AdjustmentValue]
    ) -> list[JournalLineDraft]:
        """A found count is Inventory Dr / Inventory Adjustment Cr; shrinkage the reverse."""
        by_code = await self._accounts_by_code(ctx, [INVENTORY_ADJUSTMENT])
        expense = by_code[INVENTORY_ADJUSTMENT[0]]
        products = await self._product_accounts(ctx, [x.product_id for x in adjustment])
        lines = _Lines()
        for x in adjustment:
            value = _money(x.change_quantity * x.unit_cost)
            inventory = products[x.product_id].asset_account_id
            if value > 0:
                lines.debit(inventory, value)
                lines.credit(expense, value)
            else:
                lines.debit(expense, -value)
                lines.credit(inventory, -value)
        return lines.drafts()

    async def _post(
        self,
        ctx: TenantContext,
        label: str,
        document: DocumentRef,
        lines: Sequence[JournalLineDraft],
    ) -> PostedEntry:
        # ponytail: the document survives only in the memo text and on PostedEntry;
        # journal_entries has no document columns. Add them with a migration when
        # S-07 needs to link an Auto entry back to its document.
        draft = JournalEntryDraft(
            date.today(), f"{label} {document.number}", EntrySource.AUTO, document, lines
        )
        return await post_entry(self.session, ctx, draft)

    async def _accounts_by_code(
        self, ctx: TenantContext, wanted: Sequence[tuple[str, str]]
    ) -> dict[str, UUID]:
        found = await repository.account_ids_by_code(
            self.session, ctx.organization_id, [code for code, _ in wanted]
        )
        for code, name in wanted:
            if code not in found:
                raise MissingAccount(f"{code} {name}")
        return found

    async def _product_accounts(
        self, ctx: TenantContext, product_ids: Collection[UUID]
    ) -> Mapping[UUID, ProductAccounts]:
        inventory = provide(InventoryContract)(self.session)
        accounts = await inventory.get_product_accounts(ctx, set(product_ids))
        for product_id in product_ids:
            if product_id not in accounts:
                raise MissingAccount(f"inventory or revenue account for product {product_id}")
        return accounts
