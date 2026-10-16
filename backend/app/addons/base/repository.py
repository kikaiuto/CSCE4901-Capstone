"""Data access queries for the base addon."""

"""Tenant-scoped user lookups for the base addon."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base.models import Role, User


async def find_user_for_login(
    session: AsyncSession, *, organization_id: UUID, email: str
) -> tuple[User, str] | None:
    stmt = (
        select(User, Role.name)
        .join(
            Role,
            (User.organization_id == Role.organization_id)
            & (User.role_id == Role.role_id),
        )
        .where(User.organization_id == organization_id, User.email == email)
    )
    row = (await session.execute(stmt)).one_or_none()
    return (row[0], row[1]) if row else None


async def find_user_by_id(
    session: AsyncSession, *, organization_id: UUID, user_id: UUID
) -> tuple[User, str] | None:
    stmt = (
        select(User, Role.name)
        .join(
            Role,
            (User.organization_id == Role.organization_id)
            & (User.role_id == Role.role_id),
        )
        .where(User.organization_id == organization_id, User.user_id == user_id)
    )
    row = (await session.execute(stmt)).one_or_none()
    return (row[0], row[1]) if row else None

