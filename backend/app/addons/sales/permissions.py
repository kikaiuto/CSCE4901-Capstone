"""Permissions for the sales endpoints. See security/access.md.

Features: F3, F6, F7. Requirements: R5, R6, R13, R14, R15.
"""

from app.core.rbac import RBACGuard
from app.core.roles import Role

READ_SALES = RBACGuard(Role.OWNER, Role.ADMIN, Role.SALES, Role.ACCOUNTING)
WRITE_SALES = RBACGuard(Role.OWNER, Role.ADMIN, Role.SALES)
