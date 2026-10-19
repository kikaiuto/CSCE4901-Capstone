"""Business logic and orchestration for the base addon.

Features: F1, F2. Requirements: R1, R2, R3, R4.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base import repository
from app.addons.base.schemas import UserOut


async def list_people(session: AsyncSession) -> list[UserOut]:
    return [UserOut.model_validate(u) for u in await repository.list_users(session)]
