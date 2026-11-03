"""Identity and tenancy contract.

Resolving the caller's organization and role from a verified JWT, and the
role checks every other contract is called behind.

The resolving and the role checks themselves live in core.tenancy and core.rbac,
because every route needs them before any addon code runs. What other addons
need from the base addon is the people behind ids: the owner shown on a sales
order, the actor on a ledger row.

Owned by: base (PLT). Features: F1, F2. Requirements: R1, R2, R3, R4.
"""

import uuid
from collections.abc import Collection, Mapping
from dataclasses import dataclass
from typing import Protocol, runtime_checkable

from app.core.roles import Role
from app.core.tenancy import TenantContext


@dataclass(frozen=True, slots=True)
class UserSummary:
    user_id: uuid.UUID
    full_name: str
    email: str
    role: Role
    is_active: bool


@runtime_checkable
class IdentityContract(Protocol):
    async def get_users(
        self, ctx: TenantContext, user_ids: Collection[uuid.UUID]
    ) -> Mapping[uuid.UUID, UserSummary]:
        """Users in the caller's organization. Ids from another organization are
        simply absent from the result, exactly like ids that do not exist."""
        ...
