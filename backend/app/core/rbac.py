"""Role-Based Access Control (RBAC) for Sector 7 ERP."""

from enum import StrEnum

from fastapi import Depends, HTTPException, status

from app.addons.base.schemas import CurrentUserResponse
from app.addons.base.service import get_current_user


class Permission(StrEnum):
    PRODUCT_READ = "inventory.products.read"
    PRODUCT_CREATE = "inventory.products.create"
    PRODUCT_UPDATE = "inventory.products.update"
    PRODUCT_DELETE = "inventory.products.delete"
    USER_MANAGE = "base.users.manage"


ROLE_PERMISSIONS: dict[str, frozenset[Permission]] = {
    "Owner": frozenset({
        Permission.PRODUCT_READ,
        Permission.PRODUCT_CREATE,
        Permission.PRODUCT_UPDATE,
        Permission.PRODUCT_DELETE,
        Permission.USER_MANAGE,
    }),
    "Admin": frozenset({
        Permission.PRODUCT_READ,
        Permission.PRODUCT_CREATE,
        Permission.PRODUCT_UPDATE,
        Permission.PRODUCT_DELETE,
        Permission.USER_MANAGE,
    }),
    "Sales": frozenset({
        Permission.PRODUCT_READ,
    }),
    "Warehouse": frozenset({
        Permission.PRODUCT_READ,
        Permission.PRODUCT_CREATE,
        Permission.PRODUCT_UPDATE,
    }),
    "Inventory": frozenset({
        Permission.PRODUCT_READ,
        Permission.PRODUCT_CREATE,
        Permission.PRODUCT_UPDATE,
    }),
    "Purchasing": frozenset({
        Permission.PRODUCT_READ,
    }),
    "Accounting": frozenset(),
}


def role_has_permission(role: str, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, frozenset())


class RBACGuard:
    def __init__(self, permission: Permission) -> None:
        self.permission = permission

    async def __call__(
        self,
        current_user: CurrentUserResponse = Depends(get_current_user),
    ) -> CurrentUserResponse:
        if not role_has_permission(current_user.role, self.permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        return current_user