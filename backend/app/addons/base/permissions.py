"""Permissions for identity endpoints."""

from app.core.rbac import RBACGuard
from app.core.roles import Role

VIEW_PEOPLE = RBACGuard(Role.OWNER, Role.ADMIN)
