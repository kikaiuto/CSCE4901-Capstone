"""Authenticated identity routes for the base addon."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base.schemas import CurrentUserResponse, LoginRequest, TokenResponse
from app.addons.base.service import get_current_user, login
from app.core.db import get_session

router = APIRouter(prefix="/base", tags=["Base"])


@router.post("/auth/login", response_model=TokenResponse)
async def login_route(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    return await login(payload, session)


@router.get("/auth/me", response_model=CurrentUserResponse)
async def me_route(
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> CurrentUserResponse:
    return current_user
