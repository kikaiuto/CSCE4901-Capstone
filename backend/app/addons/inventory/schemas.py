"""Pydantic schemas for inventory API responses."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: UUID
    category_id: UUID
    name: str
    sku: str
    unit_price: Decimal
    safety_stock_threshold: int
