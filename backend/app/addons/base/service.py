"""Authentication and user lookups for the base addon."""

import asyncio
import logging
from collections.abc import Collection, Iterable, Iterator, Mapping
from functools import cache
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base import repository
from app.addons.base.models import User
from app.addons.base.schemas import CurrentUserResponse, LoginRequest, TokenResponse
from app.core.config import get_settings
from app.core.contracts.identity import UserSummary
from app.core.errors import Unauthorized
from app.core.roles import Role
from app.core.security import TokenClaims, hash_password, issue_access_token, verify_password
from app.core.tenancy import TenantContext

logger = logging.getLogger("app.addons.base")

IDENTITY_KEY = "base.identity"
INVALID_CREDENTIALS = "Invalid or expired credentials"


def _role(name: str) -> Role | None:
    try:
        return Role(name)
    except ValueError:
        return None


def _own_role(name: str) -> Role:
    role = _role(name)
    if role is None:
        raise Unauthorized(INVALID_CREDENTIALS)
    return role


@cache
def _decoy_hash() -> str:
    return hash_password("sector7-decoy-password-never-assigned")


def _verify_in_thread(password: str, stored_hash: str | None) -> bool:
    return verify_password(password, stored_hash or _decoy_hash())


async def _verify(password: str, stored_hash: str | None) -> bool:
    return await asyncio.to_thread(_verify_in_thread, password, stored_hash)


def _response(user: User, role: Role) -> CurrentUserResponse:
    return CurrentUserResponse(
        user_id=user.user_id,
        organization_id=user.organization_id,
        role=role,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
    )


def _with_known_roles(rows: Iterable[tuple[User, str]]) -> Iterator[tuple[User, Role]]:
    for user, role_name in rows:
        role = _role(role_name)
        if role is None:
            logger.warning(
                "User %s has the unrecognised role %r and was left out of the listing",
                user.user_id,
                role_name,
            )
            continue
        yield user, role


async def login(payload: LoginRequest, session: AsyncSession) -> TokenResponse:
    match = await repository.find_user_for_login(
        session, organization_id=payload.organization_id, email=payload.email
    )
    user, role_name = match if match is not None else (None, "")
    usable = user is not None and user.is_active
    stored_hash = user.password_hash if usable else None
    verified = await _verify(payload.password.get_secret_value(), stored_hash)
    if not usable or not verified:
        raise Unauthorized(INVALID_CREDENTIALS)
    claims = TokenClaims(user.user_id, user.organization_id, _own_role(role_name))
    return TokenResponse(
        access_token=issue_access_token(claims),
        expires_in=get_settings().jwt_expiry_minutes * 60,
    )


async def check_identity(session: AsyncSession, claims: TokenClaims) -> None:
    """Recheck the account on every request, including role changes and deactivation."""
    match = await repository.find_user_by_id(
        session, organization_id=claims.organization_id, user_id=claims.user_id
    )
    if match is None:
        raise Unauthorized(INVALID_CREDENTIALS)
    user, role_name = match
    if not user.is_active or _own_role(role_name) != claims.role:
        raise Unauthorized(INVALID_CREDENTIALS)
    session.info[IDENTITY_KEY] = match


async def current_user(session: AsyncSession, ctx: TenantContext) -> CurrentUserResponse:
    match = session.info.get(IDENTITY_KEY)
    if match is None or match[0].user_id != ctx.user_id:
        match = await repository.find_user_by_id(
            session, organization_id=ctx.organization_id, user_id=ctx.user_id
        )
    if match is None:
        raise Unauthorized(INVALID_CREDENTIALS)
    user, role_name = match
    return _response(user, _own_role(role_name))


class IdentityService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_users(
        self, ctx: TenantContext, user_ids: Collection[UUID]
    ) -> Mapping[UUID, UserSummary]:
        rows = await repository.list_users(
            self.session, organization_id=ctx.organization_id, user_ids=user_ids
        )
        return {
            user.user_id: UserSummary(
                user.user_id, user.full_name, user.email, role, user.is_active
            )
            for user, role in _with_known_roles(rows)
        }


async def list_people(session: AsyncSession, ctx: TenantContext) -> list[CurrentUserResponse]:
    rows = await repository.list_users(session, organization_id=ctx.organization_id)
    return [_response(user, role) for user, role in _with_known_roles(rows)]
