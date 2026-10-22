"""Authentication and user lookups for the base addon."""

from collections.abc import Collection, Mapping
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base import repository
from app.addons.base.schemas import CurrentUserResponse, LoginRequest, TokenResponse
from app.core.config import get_settings
from app.core.contracts.identity import UserSummary
from app.core.errors import Unauthorized
from app.core.roles import Role
from app.core.security import TokenClaims, issue_access_token, verify_password
from app.core.tenancy import TenantContext


def _role(name: str) -> Role:
    try:
        return Role(name)
    except ValueError:
        raise Unauthorized("Invalid or expired credentials") from None


async def login(payload: LoginRequest, session: AsyncSession) -> TokenResponse:
    match = await repository.find_user_for_login(
        session, organization_id=payload.organization_id, email=payload.email
    )
    if match is None:
        raise Unauthorized("Invalid or expired credentials")
    user, role_name = match
    if not user.is_active or not verify_password(
        payload.password.get_secret_value(), user.password_hash
    ):
        raise Unauthorized("Invalid or expired credentials")
    claims = TokenClaims(user.user_id, user.organization_id, _role(role_name))
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
        raise Unauthorized("Invalid or expired credentials")
    user, role_name = match
    if not user.is_active or _role(role_name) != claims.role:
        raise Unauthorized("Invalid or expired credentials")


async def current_user(session: AsyncSession, ctx: TenantContext) -> CurrentUserResponse:
    match = await repository.find_user_by_id(
        session, organization_id=ctx.organization_id, user_id=ctx.user_id
    )
    if match is None:
        raise Unauthorized("Invalid or expired credentials")
    user, role_name = match
    return CurrentUserResponse(
        user_id=user.user_id,
        organization_id=user.organization_id,
        role=_role(role_name),
        email=user.email,
    )


class IdentityService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_users(
        self, ctx: TenantContext, user_ids: Collection[UUID]
    ) -> Mapping[UUID, UserSummary]:
        rows = await repository.list_users(self.session, user_ids=user_ids)
        return {
            user.user_id: UserSummary(
                user.user_id, user.full_name, user.email, _role(role_name), user.is_active
            )
            for user, role_name in rows
        }


async def list_people(session: AsyncSession) -> list[CurrentUserResponse]:
    return [
        CurrentUserResponse(
            user_id=user.user_id,
            organization_id=user.organization_id,
            role=_role(role_name),
            email=user.email,
        )
        for user, role_name in await repository.list_users(session)
    ]
