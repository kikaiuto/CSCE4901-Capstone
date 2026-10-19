"""FastAPI route declarations for the procurement addon.

Features: F8, F9. Requirements: R16, R17.
"""

from fastapi import APIRouter

# Mounted at /api/<addon> behind the tenant check. Each route also declares an
# RBACGuard from permissions.py matching its row in security/access.md.
router = APIRouter()
