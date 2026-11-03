"""Demo rows for the procurement addon, loaded into the seed tenants.

Features: F8, F9. Requirements: R16, R17.
Registered as the "seeds" entry of this addon's manifest (FND-06).

Suppliers only. Purchase orders wait for the receiving service.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.procurement.models import Supplier
from app.core.seeding import DemoTenant, add_missing

SUPPLIER_COUNT = 3


async def seed(session: AsyncSession, tenant: DemoTenant) -> int:
    return await add_missing(
        session,
        Supplier,
        [
            {
                "supplier_id": tenant.id_for("supplier", str(number)),
                "organization_id": tenant.organization_id,
                "name": f"Demo Supplier {number}",
                "supplier_terms": "Net 30",
                "lead_times": 7 + number,
            }
            for number in range(1, SUPPLIER_COUNT + 1)
        ],
    )
