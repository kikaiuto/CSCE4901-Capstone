
"""FastAPI route declarations for the Home addon.

Features: F14.
Requirements: R24.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.home import service
from app.addons.home.permissions import READ_INVENTORY_DASHBOARD
from app.addons.home.schemas import InventoryDashboardSummary
from app.core.tenancy import TenantContext, get_tenant_session

router = APIRouter()


@router.get(
    "/dashboard/inventory",
    response_model=InventoryDashboardSummary,
)
async def inventory_dashboard_route(
    ctx: Annotated[TenantContext, Depends(READ_INVENTORY_DASHBOARD)],
    session: Annotated[
        AsyncSession,
        Depends(get_tenant_session, scope="function"),
    ],
) -> InventoryDashboardSummary:
    """Return inventory dashboard metrics for the authenticated tenant."""

    return await service.get_inventory_dashboard(
        session=session,
        ctx=ctx,
    )
