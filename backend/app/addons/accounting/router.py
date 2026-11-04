"""S-07 journal entry endpoints (R19)."""

from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.accounting import service
from app.addons.accounting.permissions import POST_JOURNAL_ENTRY, READ_ACCOUNTING
from app.addons.accounting.schemas import (
    AccountResponse,
    JournalEntryIn,
    JournalEntrySummary,
    JournalLineOut,
    PostedEntryResponse,
)
from app.core.contracts import bind
from app.core.contracts.accounting import (
    AccountingContract,
    EntrySource,
    JournalEntryDraft,
    JournalLineDraft,
)
from app.core.tenancy import TenantContext, get_tenant_session

bind(AccountingContract, service.AccountingService)

router = APIRouter()


@router.get("/accounts", response_model=list[AccountResponse])
async def list_accounts_route(
    ctx: Annotated[TenantContext, Depends(READ_ACCOUNTING)],
    session: Annotated[AsyncSession, Depends(get_tenant_session, scope="function")],
) -> list[AccountResponse]:
    accounts = await service.list_accounts(session, ctx.organization_id)
    return [
        AccountResponse(
            account_id=a.account_id,
            account_code=a.account_code,
            account_name=a.account_name,
            account_type=a.account_type,
        )
        for a in accounts
    ]


@router.get("/journal-entries", response_model=list[JournalEntrySummary])
async def list_entries_route(
    ctx: Annotated[TenantContext, Depends(READ_ACCOUNTING)],
    session: Annotated[AsyncSession, Depends(get_tenant_session, scope="function")],
    limit: int = Query(default=20, ge=1, le=100),
) -> list[JournalEntrySummary]:
    rows = await service.list_entries(session, ctx.organization_id, limit)
    return [
        JournalEntrySummary(
            entry_id=entry.entry_id,
            entry_date=entry.entry_date,
            memo=entry.description or "",
            source=entry.source,
            total=Decimal(total).quantize(service.CENT),
            created_at=entry.created_at,
        )
        for entry, total in rows
    ]


@router.post("/journal-entries", response_model=PostedEntryResponse, status_code=201)
async def post_entry_route(
    body: JournalEntryIn,
    ctx: Annotated[TenantContext, Depends(POST_JOURNAL_ENTRY)],
    session: Annotated[AsyncSession, Depends(get_tenant_session, scope="function")],
) -> PostedEntryResponse:
    draft = JournalEntryDraft(
        entry_date=body.entry_date,
        memo=body.memo,
        source=EntrySource.MANUAL,
        document=None,
        lines=[JournalLineDraft(x.account_id, x.debit, x.credit, x.memo) for x in body.lines],
    )
    posted = await service.post_entry(session, ctx, draft)
    return PostedEntryResponse(
        entry_id=posted.entry_id,
        entry_date=posted.entry_date,
        memo=draft.memo,
        source=posted.source,
        status="POSTED",
        lines=[
            JournalLineOut(account_id=x.account_id, debit=x.debit, credit=x.credit, memo=x.memo)
            for x in posted.lines
        ],
        total_debits=sum((x.debit for x in posted.lines), Decimal("0.00")),
        total_credits=sum((x.credit for x in posted.lines), Decimal("0.00")),
    )
