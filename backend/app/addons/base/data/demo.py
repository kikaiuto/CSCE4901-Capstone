"""Demo rows for the base addon, loaded into the seed tenants.

Features: F1, F2. Requirements: R1, R2, R3, R4.
Registered as the "seeds" entry of this addon's manifest (FND-06).

The organization row and its six roles. Demo users are still to come: they need
the user-administration service so their password hashes are created the same
way as real accounts.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base.models import Organization, Role
from app.core.seeding import DemoTenant, add_missing

ROLES = ("Owner", "Admin", "Sales", "Inventory", "Purchasing", "Accounting")


async def seed(session: AsyncSession, tenant: DemoTenant) -> int:
    added = await add_missing(
        session,
        Organization,
        [{"organization_id": tenant.organization_id, "name": tenant.name}],
    )
    added += await add_missing(
        session,
        Role,
        [
            {
                "role_id": tenant.uuid("role", role),
                "organization_id": tenant.organization_id,
                "name": role,
            }
            for role in ROLES
        ],
    )
    return added
