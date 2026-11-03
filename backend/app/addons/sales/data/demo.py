"""Demo rows for the sales addon, loaded into the seed tenants.

Features: F3, F6, F7. Requirements: R5, R6, R13, R14, R15.
Registered as the "seeds" entry of this addon's manifest (FND-06).

Customers only. Sales history waits for the order and fulfilment services.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.sales.models import Customer
from app.core.seeding import DemoTenant, add_missing

CUSTOMER_COUNT = 10


async def seed(session: AsyncSession, tenant: DemoTenant) -> int:
    return await add_missing(
        session,
        Customer,
        [
            {
                "customer_id": tenant.uuid("customer", str(number)),
                "organization_id": tenant.organization_id,
                "name": f"Demo Customer {number}",
                "contact_details": f"customer{number}@example.test",
                "credit_status": "GOOD",
            }
            for number in range(1, CUSTOMER_COUNT + 1)
        ],
    )
