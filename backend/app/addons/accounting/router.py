"""FastAPI route declarations for the accounting addon.

Features: F10, F11, F12, F13, F19. Requirements: R18, R19, R20, R21, R22, R23, R31.
"""

from fastapi import APIRouter

# Mounted at /api/<addon> behind the tenant check. Each route also declares an
# RBACGuard from permissions.py matching its row in security/access.md.
router = APIRouter()
