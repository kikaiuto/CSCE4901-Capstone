"""The six roles from the product requirements. One role per user.

Kept apart from rbac.py so the token and tenancy modules can name a role without
importing the guard, which itself depends on tenancy.

Requirements: R3.
"""

from enum import StrEnum


class Role(StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    SALES = "sales"
    INVENTORY = "inventory"
    PURCHASING = "purchasing"
    ACCOUNTING = "accounting"


ALL_ROLES = frozenset(Role)
