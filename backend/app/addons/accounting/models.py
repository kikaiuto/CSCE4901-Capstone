
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ChartOfAccounts(Base):
    __tablename__ = "chart_of_accounts"
    __table_args__ = (
        UniqueConstraint("organization_id", "account_id"),
        UniqueConstraint("organization_id", "account_code"),
    )

    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("organizations.organization_id"),
        nullable=False,
    )
    account_code: Mapped[str] = mapped_column(
        String(30), nullable=False
    )
    account_name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )
    account_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )


class JournalEntry(Base):
    __tablename__ = "journal_entries"
    __table_args__ = (
        UniqueConstraint("organization_id", "entry_id"),
        CheckConstraint(
            "status IN ('DRAFT', 'POSTED')",
            name="ck_journal_entry_status",
        ),
    )

    entry_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("organizations.organization_id"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="DRAFT"
    )
    description: Mapped[str | None] = mapped_column(
        String(500)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class JournalEntryLine(Base):
    __tablename__ = "journal_entry_lines"
    __table_args__ = (
        UniqueConstraint("organization_id", "line_id"),
        ForeignKeyConstraint(
            ["organization_id", "entry_id"],
            ["journal_entries.organization_id",
             "journal_entries.entry_id"],
        ),
        ForeignKeyConstraint(
            ["organization_id", "account_id"],
            ["chart_of_accounts.organization_id",
             "chart_of_accounts.account_id"],
        ),
        CheckConstraint(
            "debit >= 0 AND credit >= 0",
            name="ck_journal_line_nonnegative",
        ),
        CheckConstraint(
            "(debit > 0 AND credit = 0) OR "
            "(credit > 0 AND debit = 0)",
            name="ck_journal_line_one_side",
        ),
    )

    line_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("organizations.organization_id"),
        nullable=False,
    )
    entry_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False
    )
    debit: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, server_default="0"
    )
    credit: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, server_default="0"
    )
