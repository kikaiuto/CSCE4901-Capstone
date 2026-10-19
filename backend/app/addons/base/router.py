"""FastAPI route declarations for the base addon.

`router` is mounted behind the tenant check; sign in and "Create an
organization" (S1-PLT-03, S1-PLT-04) will go on a `public_router` here.

Features: F1, F2. Requirements: R1, R2, R3, R4.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base import service
from app.addons.base.permissions import VIEW_PEOPLE
from app.addons.base.schemas import UserOut
from app.core.tenancy import get_tenant_session

router = APIRouter()


@router.get("/users", response_model=list[UserOut], dependencies=[Depends(VIEW_PEOPLE)])
async def list_users(
    session: Annotated[AsyncSession, Depends(get_tenant_session)],
) -> list[UserOut]:
    return await service.list_people(session)
