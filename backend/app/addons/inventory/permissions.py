"""Permissions for the current inventory endpoints."""

from app.core.rbac import RBACGuard
from app.core.roles import Role

READ_PRODUCTS = RBACGuard(Role.OWNER, Role.ADMIN, Role.SALES, Role.INVENTORY, Role.PURCHASING)
