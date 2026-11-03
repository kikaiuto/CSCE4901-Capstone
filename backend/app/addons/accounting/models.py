import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKeyConstraint,
    Numeric,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.core.tenancy import TenantScoped


class ChartOfAccounts(TenantScoped, Base):
    __tablename__ = "chart_of_accounts"
    __table_args__ = (
        UniqueConstraint("organization_id", "account_id"),
        UniqueConstraint("organization_id", "account_code"),
    )

    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    account_code: Mapped[str] = mapped_column(String(30), nullable=False)
    account_name: Mapped[str] = mapped_column(String(150), nullable=False)
    account_type: Mapped[str] = mapped_column(String(30), nullable=False)


class JournalEntry(TenantScoped, Base):
    __tablename__ = "journal_entries"
    __table_args__ = (
        UniqueConstraint("organization_id", "entry_id"),
        CheckConstraint(
            "status IN ('DRAFT', 'POSTED')",
            name="ck_journal_entry_status",
        ),
        CheckConstraint("source IN ('manual', 'auto')", name="ck_journal_entry_source"),
    )

    entry_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="DRAFT")
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    source: Mapped[str] = mapped_column(String(10), nullable=False, server_default="manual")
    description: Mapped[str | None] = mapped_column(String(500))
    """The entry memo shown on S-07."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class JournalEntryLine(TenantScoped, Base):
    __tablename__ = "journal_entry_lines"
    __table_args__ = (
        UniqueConstraint("organization_id", "line_id"),
        ForeignKeyConstraint(
            ["organization_id", "entry_id"],
            ["journal_entries.organization_id", "journal_entries.entry_id"],
        ),
        ForeignKeyConstraint(
            ["organization_id", "account_id"],
            ["chart_of_accounts.organization_id", "chart_of_accounts.account_id"],
        ),
        CheckConstraint(
            "debit >= 0 AND credit >= 0",
            name="ck_journal_line_nonnegative",
        ),
        CheckConstraint(
            "(debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)",
            name="ck_journal_line_one_side",
        ),
    )

    line_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    entry_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    debit: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default="0")
    credit: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default="0")
    memo: Mapped[str | None] = mapped_column(String(500))
