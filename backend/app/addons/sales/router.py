"""FastAPI route declarations for the sales addon.

Features: F3, F6, F7. Requirements: R5, R6, R13, R14, R15.
"""

from fastapi import APIRouter

# Mounted at /api/<addon> behind the tenant check. Each route also declares an
# RBACGuard from permissions.py matching its row in security/access.md.
router = APIRouter()
