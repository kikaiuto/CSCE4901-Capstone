"""FastAPI route declarations for the home addon.

Features: F14. Requirements: R24.
"""

from fastapi import APIRouter

# Mounted at /api/<addon> behind the tenant check. Each route also declares an
# RBACGuard from permissions.py matching its row in security/access.md.
router = APIRouter()
