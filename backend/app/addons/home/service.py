
"""Business logic for the Home dashboard.

Features: F14.
Requirements: R24.

Dashboard data comes from registered read-only providers.
The Home addon does not import operational ORM models.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.home.schemas import InventoryDashboardSummary
from app.core.contracts.inventory import InventoryDashboardMetrics
from app.core.registry import dashboard_metric
from app.core.tenancy import TenantContext


async def get_inventory_dashboard(
    session: AsyncSession,
    ctx: TenantContext,
) -> InventoryDashboardSummary:
    """Return authoritative inventory KPIs for the current organization."""

    metrics = await dashboard_metric(
        name="inventory",
        session=session,
        ctx=ctx,
    )

    if not isinstance(metrics, InventoryDashboardMetrics):
        raise RuntimeError(
            "Inventory dashboard provider returned unexpected metrics"
        )

    return InventoryDashboardSummary(
        total_products=metrics.total_products,
        on_hand_units=metrics.on_hand_units,
        available_units=metrics.available_units,
        inventory_value=metrics.inventory_value,
        low_stock_products=metrics.low_stock_products,
        out_of_stock_products=metrics.out_of_stock_products,
    )
