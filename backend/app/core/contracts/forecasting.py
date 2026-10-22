"""Forecasting contract.

Batch Holt-Winters demand forecasts read by the S-05 overlay. Returns
INSUFFICIENT_DATA rather than a number for a product without enough history.

Forecasts are computed by the Celery worker off the request path. The request
side only reads the latest stored result, so get_forecast never runs the model.

Owned by: forecasting (AIX). Called by: inventory (S-05 overlay), ai (read only).

Features: F17. Requirements: R28, R29.
"""

import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, datetime
from enum import StrEnum
from typing import Protocol, runtime_checkable

from app.core.tenancy import TenantContext

# R30: under 30 calendar days of history or fewer than 10 sales events, no forecast.
MIN_HISTORY_DAYS = 30
MIN_SALES_EVENTS = 10


class ForecastStatus(StrEnum):
    OK = "ok"
    INSUFFICIENT_DATA = "insufficient_data"


@dataclass(frozen=True, slots=True)
class ForecastPoint:
    """Demand in units. A quantity, not money, so float is allowed here."""

    day: date
    expected: float
    lower: float
    upper: float


@dataclass(frozen=True, slots=True)
class Forecast:
    product_id: uuid.UUID
    status: ForecastStatus
    points: Sequence[ForecastPoint]
    """Empty when status is INSUFFICIENT_DATA."""
    generated_at: datetime | None


def passes_cold_start_guardrail(history_days: int, sales_events: int) -> bool:
    return history_days >= MIN_HISTORY_DAYS and sales_events >= MIN_SALES_EVENTS


@runtime_checkable
class ForecastingContract(Protocol):
    async def get_forecast(self, ctx: TenantContext, product_id: uuid.UUID) -> Forecast: ...
