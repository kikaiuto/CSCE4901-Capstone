"""RBAC permission definitions and access checks for the base addon.

One guard per row of security/access.md. Routes use these names rather than
listing roles inline, so the matrix and the code are read side by side.

Features: F1, F2. Requirements: R1, R2, R3, R4.
"""

from app.core.rbac import RBACGuard, Role

# S-09 People and Roles is the Admin workspace: Owner and Admin only.
VIEW_PEOPLE = RBACGuard(Role.OWNER, Role.ADMIN)
