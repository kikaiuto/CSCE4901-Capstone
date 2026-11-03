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

    @classmethod
    def _missing_(cls, value: object) -> "Role | None":
        if isinstance(value, str):
            name = value.strip().lower()
            # The existing demo database calls the inventory role Warehouse.
            if name == "warehouse":
                name = "inventory"
            return next((role for role in cls if role.value == name), None)
        return None


ALL_ROLES = frozenset(Role)
