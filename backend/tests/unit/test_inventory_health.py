
"""Tests for inventory health calculations."""

import pytest

from app.addons.inventory.health import (
    StockStatus,
    calculate_inventory_health,
)


@pytest.mark.parametrize(
    ("quantity", "threshold", "expected_status", "restock"),
    [
        (50, 10, StockStatus.HEALTHY, 0),
        (5, 10, StockStatus.LOW_STOCK, 5),
        (0, 10, StockStatus.OUT_OF_STOCK, 10),
        (10, 10, StockStatus.LOW_STOCK, 0),
        (1, 0, StockStatus.HEALTHY, 0),
        (0, 0, StockStatus.OUT_OF_STOCK, 0),
    ],
)
def test_inventory_health(
    quantity,
    threshold,
    expected_status,
    restock,
):
    result = calculate_inventory_health(quantity, threshold)

    assert result.status == expected_status
    assert result.suggested_restock_quantity == restock


@pytest.mark.parametrize(
    ("quantity", "threshold"),
    [
        (-1, 10),
        (5, -1),
    ],
)
def test_negative_inputs_rejected(quantity, threshold):
    with pytest.raises(ValueError):
        calculate_inventory_health(quantity, threshold)
