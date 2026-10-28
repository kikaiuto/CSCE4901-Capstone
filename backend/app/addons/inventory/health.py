
"""Inventory health and restocking calculations."""

from dataclasses import dataclass
from enum import StrEnum


class StockStatus(StrEnum):
    """Possible inventory stock health classifications."""

    HEALTHY = "HEALTHY"
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"


@dataclass(frozen=True)
class InventoryHealth:
    """Calculated inventory health information."""

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

    # Zero inventory is always out of stock.
    if quantity == 0:
        status = StockStatus.OUT_OF_STOCK

    # Low stock means inventory is BELOW the safety threshold.
    elif quantity < safety_stock_threshold:
        status = StockStatus.LOW_STOCK

    # Inventory at or above the threshold is healthy.
    else:
        status = StockStatus.HEALTHY

    # Replenish only enough to reach the safety threshold.
    suggested_restock_quantity = max(
        safety_stock_threshold - quantity,
        0,
    )

    return InventoryHealth(
        quantity=quantity,
        safety_stock_threshold=safety_stock_threshold,
        status=status,
        suggested_restock_quantity=suggested_restock_quantity,
    )
