
"""Pydantic schemas for inventory API requests and responses."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductResponse(BaseModel):
    """Response schema for inventory products."""

    model_config = ConfigDict(from_attributes=True)

    product_id: UUID
    category_id: UUID
    name: str
    sku: str
    unit_price: Decimal
    safety_stock_threshold: int


class ProductCreateRequest(BaseModel):
    """Request schema for creating a product."""

    name: str = Field(min_length=1, max_length=150)
    sku: str = Field(min_length=1, max_length=80)

    category_id: UUID
    asset_account_id: UUID
    revenue_account_id: UUID

    unit_cost: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=4,
    )
    unit_price: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=4,
    )
    safety_stock_threshold: int = Field(default=0, ge=0)

    @field_validator("name", "sku", mode="before")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        """Trim surrounding whitespace before field validation."""
        return value.strip() if isinstance(value, str) else value
