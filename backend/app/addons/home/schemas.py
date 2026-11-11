"""Pydantic response schemas for the ERP operational dashboard.

Feature: F14 - Operational Dashboard
Requirement: R24
"""

from decimal import Decimal

from pydantic import BaseModel, Field


class InventoryDashboardSummary(BaseModel):
    """Inventory metrics for the authenticated organization."""

    total_products: int = Field(ge=0)
    on_hand_units: int = Field(ge=0)
    available_units: int = Field(ge=0)

    inventory_value: Decimal = Field(description="On-hand inventory valued at moving-average cost.")

    low_stock_products: int = Field(ge=0)
    out_of_stock_products: int = Field(ge=0)


class SalesDashboardSummary(BaseModel):
    """Sales order metrics for the authenticated organization."""

    total_orders: int = Field(ge=0)
    draft_orders: int = Field(ge=0)
    confirmed_orders: int = Field(ge=0)
    fulfilled_orders: int = Field(ge=0)
    cancelled_orders: int = Field(ge=0)

    fulfilled_sales_total: Decimal = Field(description="Total value of fulfilled sales orders.")


class FinancialDashboardSummary(BaseModel):
    """Financial metrics derived from authoritative accounting data."""

    gross_margin: Decimal = Field(description="Recognized revenue minus cost of goods sold.")

    accounts_receivable: Decimal = Field(description="Outstanding accounts receivable balance.")

    accounts_payable: Decimal = Field(description="Outstanding accounts payable balance.")


class DashboardSummaryResponse(BaseModel):
    """Complete tenant-scoped operational dashboard response."""

    organization_id: str

    inventory: InventoryDashboardSummary
    sales: SalesDashboardSummary
    financial: FinancialDashboardSummary
