"""Role guards shared by tenant routes."""

from typing import Annotated

from fastapi import Depends

from app.core.errors import Forbidden
from app.core.roles import ALL_ROLES, Role
from app.core.tenancy import TenantContext, get_tenant_context

__all__ = ["ALL_ROLES", "RBACGuard", "Role"]


class RBACGuard:
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
