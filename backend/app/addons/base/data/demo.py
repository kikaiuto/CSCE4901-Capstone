"""Demo rows for the base addon, loaded into the seed tenants.

Features: F1, F2. Requirements: R1, R2, R3, R4.
Registered as the "seeds" entry of this addon's manifest (FND-06).

The organization row, its six roles, and one demo user per role. Every demo
user shares DEMO_PASSWORD, hashed once per process with the same Argon2id
parameters real accounts use, so the sign-in screen can be exercised against
a seeded database.
"""

from functools import cache

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base.models import Organization, Role, User
from app.core.roles import Role as AppRole
from app.core.security import hash_password
from app.core.seeding import DemoTenant, add_missing

ROLES = tuple(role.value.title() for role in AppRole)
DEMO_PASSWORD = "sector7-demo"
DEMO_USERS = (
    ("Owner", "Dana Owens"),
    ("Admin", "Mo Ferrara"),
    ("Sales", "Priya Raman"),
    ("Inventory", "Lee Carter"),
    ("Purchasing", "Sam Oyelaran"),
    ("Accounting", "Ted Brill"),
)


@cache
def demo_password_hash() -> str:
    return hash_password(DEMO_PASSWORD)


def demo_email(tenant: DemoTenant, role: str) -> str:
    return f"{role.lower()}@{tenant.slug}.demo"


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
                "role_id": tenant.id_for("role", role),
                "organization_id": tenant.organization_id,
                "name": role,
            }
            for role in ROLES
        ],
    )
    role_ids = dict(
        (
            await session.execute(
                select(Role.name, Role.role_id).where(
                    Role.organization_id == tenant.organization_id
                )
            )
        ).all()
    )
    added += await add_missing(
        session,
        User,
        [
            {
                "user_id": tenant.id_for("user", demo_email(tenant, role)),
                "organization_id": tenant.organization_id,
                "role_id": role_ids[role],
                "email": demo_email(tenant, role),
                "password_hash": demo_password_hash(),
                "full_name": full_name,
                "is_active": True,
            }
            for role, full_name in DEMO_USERS
        ],
    )
    return added
