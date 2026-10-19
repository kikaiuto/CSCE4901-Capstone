"""FastAPI route declarations for the ai addon.

Features: F15, F16, F18. Requirements: R25, R26, R27, R30.
Read-only endpoints only; no route here may mutate operational ERP state.
"""

from fastapi import APIRouter

# Mounted at /api/<addon> behind the tenant check. Each route also declares an
# RBACGuard from permissions.py matching its row in security/access.md.
router = APIRouter()
