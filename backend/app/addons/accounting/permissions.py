"""Permissions for the accounting endpoints. See security/access.md.

Requirements: R19.
"""

from app.core.rbac import RBACGuard
from app.core.roles import Role

READ_ACCOUNTING = RBACGuard(Role.OWNER, Role.ADMIN, Role.ACCOUNTING)
POST_JOURNAL_ENTRY = RBACGuard(Role.OWNER, Role.ADMIN, Role.ACCOUNTING)
