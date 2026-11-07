"""Permissions for the accounting endpoints. See security/access.md.

Requirements: R18, R19.
"""

from app.core.rbac import RBACGuard
from app.core.roles import Role

READ_CHART_OF_ACCOUNTS = RBACGuard(Role.OWNER, Role.ADMIN, Role.ACCOUNTING, Role.INVENTORY)
READ_ACCOUNTING = RBACGuard(Role.OWNER, Role.ADMIN, Role.ACCOUNTING)
POST_JOURNAL_ENTRY = RBACGuard(Role.OWNER, Role.ADMIN, Role.ACCOUNTING)
