"""Double-entry validation and journal posting (R19).

post_entry is the only way a journal entry is written; sales and procurement will
post through it too, so the balance check can never be skipped.
"""

from collections.abc import Sequence
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Row
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.accounting import repository
from app.addons.accounting.models import ChartOfAccounts, JournalEntry, JournalEntryLine
from app.core.contracts.accounting import (
    BalanceCheck,
    JournalEntryDraft,
    JournalLineDraft,
    LineError,
    LineProblem,
    PostedEntry,
    UnbalancedEntry,
)
from app.core.errors import AppError
from app.core.tenancy import TenantContext

CENT = Decimal("0.01")


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
