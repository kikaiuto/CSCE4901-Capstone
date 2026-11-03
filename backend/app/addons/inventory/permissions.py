
"""Permissions for inventory endpoints."""

from app.core.rbac import RBACGuard
from app.core.roles import Role

# Users allowed to view products.
READ_PRODUCTS = RBACGuard(
    Role.OWNER,
    Role.ADMIN,
    Role.SALES,
    Role.INVENTORY,
    Role.PURCHASING,
)

# Users allowed to create products.
CREATE_PRODUCTS = RBACGuard(
    Role.OWNER,
    Role.ADMIN,
    Role.INVENTORY,
)
