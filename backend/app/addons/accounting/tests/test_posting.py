"""Automatic postings: each post_* writes exactly what its preview_* showed.

Features: F11, F12. Requirements: R20, R21, R22."""

import uuid
from decimal import Decimal as D

import pytest
from sqlalchemy import select

from app.addons.accounting.models import JournalEntry, JournalEntryLine
from app.addons.accounting.service import AccountingService, MissingAccount
from app.addons.accounting.tests.conftest import add_accounts
from app.core.contracts.accounting import (
    AdjustmentValue,
    JournalLineDraft,
    ReceiptLine,
    SaleDocument,
    SaleLine,
)
from app.core.contracts.common import DocumentKind, DocumentRef
from app.core.roles import Role
from app.core.tenancy import TenantContext, bind_session


def ctx_for(tenant):
    return TenantContext(tenant.organization_id, tenant.users[Role.OWNER], Role.OWNER)


def doc(kind, number):
    return DocumentRef(kind, uuid.uuid4(), number)


async def stored_lines(session, entry_id):
    rows = await session.scalars(
        select(JournalEntryLine).where(JournalEntryLine.entry_id == entry_id)
    )
    return sorted((r.account_id, r.debit, r.credit) for r in rows)


def sale(tenant, tax="2.48"):
    return SaleDocument(
        doc(DocumentKind.SALES_ORDER, "SO-1044"),
        [SaleLine(tenant.product_id, 2, D("15.00"), D("10.0000"))],
        D(tax),
    )


async def test_sale_preview_equals_post_with_tax(sessions, tenants, inventory):
    acme, _ = tenants
    accounts = await add_accounts(sessions, acme)
    async with sessions() as session:
        bind_session(session, acme.organization_id)
        svc = AccountingService(session)
        preview = await svc.preview_sale(ctx_for(acme), sale(acme))
        posted = await svc.post_sale(ctx_for(acme), sale(acme))
        await session.commit()

        assert list(posted.lines) == list(preview)
        assert list(preview) == [
            JournalLineDraft(accounts["1100"], debit=D("32.48")),
            JournalLineDraft(acme.revenue_id, credit=D("30.00")),
            JournalLineDraft(accounts["2100"], credit=D("2.48")),
            JournalLineDraft(accounts["5000"], debit=D("20.00")),
            JournalLineDraft(acme.asset_id, credit=D("20.00")),
        ]
        entry = await session.get(JournalEntry, posted.entry_id)
        assert (entry.source, entry.description) == ("auto", "Sale SO-1044")
        assert posted.document.number == "SO-1044"
        assert await stored_lines(session, posted.entry_id) == sorted(
            (x.account_id, x.debit, x.credit) for x in preview
        )


async def test_untaxed_sale_has_no_tax_line_and_needs_no_tax_account(sessions, tenants, inventory):
    acme, _ = tenants
    await add_accounts(sessions, acme, ("1100", "5000"))
    async with sessions() as session:
        bind_session(session, acme.organization_id)
        lines = await AccountingService(session).preview_sale(ctx_for(acme), sale(acme, "0"))
    assert len(lines) == 4
    assert sum(x.debit for x in lines) == sum(x.credit for x in lines) == D("50.00")


async def test_missing_account_is_named_and_writes_nothing(sessions, tenants, inventory):
    acme, _ = tenants
    await add_accounts(sessions, acme, ("1100", "5000"))
    async with sessions() as session:
        bind_session(session, acme.organization_id)
        with pytest.raises(MissingAccount) as raised:
            await AccountingService(session).post_sale(ctx_for(acme), sale(acme))
        assert raised.value.status_code == 422
        assert raised.value.details() == {"account": "2100 Sales Tax Payable"}
        assert (await session.scalars(select(JournalEntry))).all() == []


async def test_receipt_preview_equals_post(sessions, tenants, inventory):
    acme, _ = tenants
    accounts = await add_accounts(sessions, acme)
    lines = [ReceiptLine(acme.product_id, 3, D("12.3333")), ReceiptLine(acme.product_id, 1, D("5"))]
    async with sessions() as session:
        bind_session(session, acme.organization_id)
        svc = AccountingService(session)
        preview = await svc.preview_receipt(ctx_for(acme), lines)
        posted = await svc.post_receipt(
            ctx_for(acme), doc(DocumentKind.PURCHASE_ORDER, "PO-0214"), lines
        )
        assert (
            list(posted.lines)
            == list(preview)
            == [
                JournalLineDraft(acme.asset_id, debit=D("42.00")),
                JournalLineDraft(accounts["2000"], credit=D("42.00")),
            ]
        )
        assert posted.source == "auto"


async def test_shrinkage_adjustment_credits_inventory(sessions, tenants, inventory):
    acme, _ = tenants
    accounts = await add_accounts(sessions, acme)
    async with sessions() as session:
        bind_session(session, acme.organization_id)
        posted = await AccountingService(session).post_adjustment(
            ctx_for(acme),
            doc(DocumentKind.ADJUSTMENT, "ADJ-0042"),
            [AdjustmentValue(acme.product_id, -2, D("10.0000"))],
        )
    assert list(posted.lines) == [
        JournalLineDraft(accounts["5100"], debit=D("20.00")),
        JournalLineDraft(acme.asset_id, credit=D("20.00")),
    ]
