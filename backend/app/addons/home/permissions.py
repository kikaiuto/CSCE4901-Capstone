
"""RBAC permissions for the Home dashboard.

Features: F14.
Requirements: R24.
"""

from app.core.rbac import RBACGuard
from app.core.roles import Role

# Use the same access policy as the Inventory product-read endpoint.
# Review this policy with the team before merging.

READ_INVENTORY_DASHBOARD = RBACGuard(
    Role.OWNER,
    Role.ADMIN,
    Role.SALES,
    Role.INVENTORY,
    Role.PURCHASING,
)
