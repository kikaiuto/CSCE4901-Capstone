"""FastAPI route declarations for the forecasting addon.

Features: F17. Requirements: R28, R29.
"""

from fastapi import APIRouter

# Mounted at /api/<addon> behind the tenant check. Each route also declares an
# RBACGuard from permissions.py matching its row in security/access.md.
router = APIRouter()
