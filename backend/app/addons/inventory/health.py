
"""Inventory health and restocking calculations."""

from dataclasses import dataclass
from enum import StrEnum


class StockStatus(StrEnum):
    HEALTHY = "HEALTHY"
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"


@dataclass(frozen=True)
class InventoryHealth:
    quantity: int
    safety_stock_threshold: int
    status: StockStatus
    suggested_restock_quantity: int


def calculate_inventory_health(
    quantity: int,
    safety_stock_threshold: int,
) -> InventoryHealth:
    """Calculate inventory status and minimum replenishment quantity."""

    if quantity < 0:
        raise ValueError("Stock quantity cannot be negative")

    if safety_stock_threshold < 0:
        raise ValueError("Safety stock threshold cannot be negative")

    if quantity == 0:
        status = StockStatus.OUT_OF_STOCK
    elif quantity <= safety_stock_threshold:
        status = StockStatus.LOW_STOCK
    else:
        status = StockStatus.HEALTHY

    return InventoryHealth(
        quantity=quantity,
        safety_stock_threshold=safety_stock_threshold,
        status=status,
        suggested_restock_quantity=max(
            safety_stock_threshold - quantity,
            0,
        ),
    )
