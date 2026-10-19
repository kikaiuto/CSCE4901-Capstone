"""Data access queries for the base addon.

The session passed in is already bound to the caller's organization by
core.tenancy, so these queries carry no organization_id filter of their own; it
is added centrally on every statement.

Features: F1, F2. Requirements: R1, R2, R3, R4.
"""

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base.models import User


async def list_users(session: AsyncSession) -> Sequence[User]:
    result = await session.scalars(select(User).order_by(User.full_name, User.email))
    return result.all()
