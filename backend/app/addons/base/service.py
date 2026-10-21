"""Business logic and orchestration for the base addon."""

"""Authentication business logic for the base addon."""

from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base import repository
from app.addons.base.schemas import CurrentUserResponse, LoginRequest, TokenResponse
from app.addons.base.security.auth import (
    create_access_token,
    decode_access_token,
    verify_password,
)
from app.core.config import get_settings
from app.core.db import get_session

bearer = HTTPBearer(auto_error=False)


def unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def login(payload: LoginRequest, session: AsyncSession) -> TokenResponse:
    match = await repository.find_user_for_login(
        session, organization_id=payload.organization_id, email=payload.email
    )
    if match is None:
        raise unauthorized()
    user, role_name = match
    if not verify_password(payload.password.get_secret_value(), user.password_hash):
        raise unauthorized()
    token = create_access_token(
        user_id=user.user_id,
        organization_id=user.organization_id,
        role=role_name,
    )
    return TokenResponse(
        access_token=token,
        expires_in=get_settings().jwt_expiry_minutes * 60,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: AsyncSession = Depends(get_session),
) -> CurrentUserResponse:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized()
    try:
        claims = decode_access_token(credentials.credentials)
        user_id = UUID(claims["sub"])
        organization_id = UUID(claims["org"])
        role = claims["role"]
        if not isinstance(role, str):
            raise ValueError("Invalid role")
    except (jwt.PyJWTError, ValueError, KeyError, TypeError) as exc:
        raise unauthorized() from exc

    match = await repository.find_user_by_id(
        session, organization_id=organization_id, user_id=user_id
    )
    if match is None:
        raise unauthorized()
    user, current_role = match
    if current_role != role:
        raise unauthorized()
    return CurrentUserResponse(
        user_id=user.user_id,
        organization_id=user.organization_id,
        role=current_role,
        email=user.email,
    )

