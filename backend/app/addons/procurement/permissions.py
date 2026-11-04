"""Permissions for the procurement endpoints. See security/access.md.

Features: F8, F9. Requirements: R16, R17.
"""

from app.core.rbac import RBACGuard
from app.core.roles import Role

READ_PROCUREMENT = RBACGuard(
    Role.OWNER, Role.ADMIN, Role.PURCHASING, Role.INVENTORY, Role.ACCOUNTING
)
MANAGE_PROCUREMENT = RBACGuard(Role.OWNER, Role.ADMIN, Role.PURCHASING, Role.INVENTORY)
