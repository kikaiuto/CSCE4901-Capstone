"""FastAPI route declarations for the inventory addon.

Features: F4, F5, F6, F9, F19. Requirements: R7, R8, R9, R10, R11, R12, R31.
"""

from fastapi import APIRouter

# Mounted at /api/<addon> behind the tenant check. Each route also declares an
# RBACGuard from permissions.py matching its row in security/access.md.
router = APIRouter()
