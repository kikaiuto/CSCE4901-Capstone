"""Tenant-scoped database queries for accounting."""

from collections.abc import Collection
from uuid import UUID

from sqlalchemy import Row, and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.accounting.models import ChartOfAccounts, JournalEntry, JournalEntryLine


async def list_accounts(session: AsyncSession, organization_id: UUID) -> list[ChartOfAccounts]:
    statement = (
        select(ChartOfAccounts)
        .where(ChartOfAccounts.organization_id == organization_id)
        .order_by(ChartOfAccounts.account_code)
    )
    return list((await session.scalars(statement)).all())


async def existing_account_ids(
    session: AsyncSession, organization_id: UUID, account_ids: Collection[UUID]
) -> set[UUID]:
    statement = select(ChartOfAccounts.account_id).where(
        ChartOfAccounts.organization_id == organization_id,
        ChartOfAccounts.account_id.in_(account_ids),
    )
    return set((await session.scalars(statement)).all())


async def list_entries(session: AsyncSession, organization_id: UUID, limit: int) -> list[Row]:
    """(entry, debit total) pairs, newest entry date first."""
    total = func.coalesce(func.sum(JournalEntryLine.debit), 0)
    statement = (
        select(JournalEntry, total)
        .outerjoin(
            JournalEntryLine,
            and_(
                JournalEntryLine.organization_id == JournalEntry.organization_id,
                JournalEntryLine.entry_id == JournalEntry.entry_id,
            ),
        )
        .where(JournalEntry.organization_id == organization_id)
        .group_by(JournalEntry.entry_id)
        .order_by(JournalEntry.entry_date.desc(), JournalEntry.created_at.desc())
        .limit(limit)
    )
    return list((await session.execute(statement)).all())


async def add_entry(
    session: AsyncSession, entry: JournalEntry, lines: list[JournalEntryLine]
) -> None:
    session.add_all([entry, *lines])
    await session.flush()


async def account_ids_by_code(
    session: AsyncSession, organization_id: UUID, codes: Collection[str]
) -> dict[str, UUID]:
    statement = select(ChartOfAccounts.account_code, ChartOfAccounts.account_id).where(
        ChartOfAccounts.organization_id == organization_id,
        ChartOfAccounts.account_code.in_(codes),
    )
    return {code: account_id for code, account_id in (await session.execute(statement)).all()}
