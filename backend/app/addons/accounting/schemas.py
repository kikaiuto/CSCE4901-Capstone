"""Pydantic schemas for the S-07 journal entry API. Money serializes as strings."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.core.contracts.accounting import AccountType, EntrySource

# NUMERIC(15, 2) holds at most 13 integer digits.
MAX_AMOUNT = Decimal("10000000000000")


class AccountResponse(BaseModel):
    account_id: UUID
    account_code: str
    account_name: str
    account_type: AccountType

    @field_validator("account_type", mode="before")
    @classmethod
    def _lowercase(cls, value: str) -> str:
        # The seeder stores "Asset"; the contract's AccountType is lowercase.
        return value.lower()


class JournalEntrySummary(BaseModel):
    entry_id: UUID
    entry_date: date
    memo: str
    source: EntrySource
    total: Decimal
    created_at: datetime


class JournalLineIn(BaseModel):
    account_id: UUID
    # Sign and precision are left to validate_double_entry so it can report them per line.
    debit: Decimal = Field(default=Decimal("0.00"), lt=MAX_AMOUNT)
    credit: Decimal = Field(default=Decimal("0.00"), lt=MAX_AMOUNT)
    memo: str = Field(default="", max_length=500)


class JournalEntryIn(BaseModel):
    entry_date: date
    memo: str = Field(max_length=500)
    lines: list[JournalLineIn] = Field(max_length=500)


class JournalLineOut(BaseModel):
    account_id: UUID
    debit: Decimal
    credit: Decimal
    memo: str


class PostedEntryResponse(BaseModel):
    entry_id: UUID
    entry_date: date
    memo: str
    source: EntrySource
    status: str
    lines: list[JournalLineOut]
    total_debits: Decimal
    total_credits: Decimal
