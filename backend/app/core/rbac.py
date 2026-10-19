"""Role definitions and permission dependency helpers shared by all modules.

Every route under /api declares an RBACGuard; tests/architecture/test_routes.py
fails the build for a route that does not. Each addon's security/access.md is the
matrix its guards must match.

Features: F2. Requirements: R3.
"""

from typing import Annotated

from fastapi import Depends

from app.core.errors import Forbidden
from app.core.roles import ALL_ROLES, Role
from app.core.tenancy import TenantContext, get_tenant_context

__all__ = ["ALL_ROLES", "RBACGuard", "Role"]


class RBACGuard:
    """FastAPI dependency that admits only the listed roles.

    Usage on a route:

        @router.get("/orders", dependencies=[Depends(RBACGuard(Role.OWNER, Role.SALES))])

    RBACGuard.any_role() is the pass-through guard from FND-03: it still requires
    a verified tenant, but admits every role. Replace it with the real role list
    from access.md when the endpoint's row is filled in.
    """

    def __init__(self, *allowed: Role) -> None:
        if not allowed:
            raise ValueError("RBACGuard needs at least one role; use RBACGuard.any_role()")
        self.allowed = frozenset(allowed)

    @classmethod
    def any_role(cls) -> "RBACGuard":
        return cls(*ALL_ROLES)

    def __call__(self, ctx: Annotated[TenantContext, Depends(get_tenant_context)]) -> TenantContext:
        if ctx.role not in self.allowed:
            raise Forbidden(f"The {ctx.role} role cannot perform this action")
        return ctx

    def __repr__(self) -> str:
        return f"RBACGuard({', '.join(sorted(self.allowed))})"
