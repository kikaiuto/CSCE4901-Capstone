"""Tenant-scoped user lookups for the base addon."""

from collections.abc import Collection
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.base.models import Organization, Role, User


async def get_organization(session: AsyncSession, *, organization_id: UUID) -> Organization | None:
    return await session.scalar(
        select(Organization).where(Organization.organization_id == organization_id)
    )


def _users_with_roles() -> Select:
    return select(User, Role.name).join(
        Role,
        (User.organization_id == Role.organization_id) & (User.role_id == Role.role_id),
    )


async def list_users(
    session: AsyncSession, *, organization_id: UUID, user_ids: Collection[UUID] | None = None
) -> list[tuple[User, str]]:
    statement = (
        _users_with_roles().where(User.organization_id == organization_id).order_by(User.email)
    )
    if user_ids is not None:
        statement = statement.where(User.user_id.in_(user_ids))
    return [(row[0], row[1]) for row in (await session.execute(statement)).all()]


async def find_user_for_login(
    session: AsyncSession, *, organization_id: UUID, email: str
) -> tuple[User, str] | None:
    # Older records predate email normalization in the User model.
    stmt = (
        _users_with_roles()
        .where(User.organization_id == organization_id, func.lower(User.email) == email)
        .limit(2)
    )
    rows = (await session.execute(stmt)).all()
    if len(rows) != 1:
        # Case-only duplicates need administrative cleanup, not an arbitrary match.
        return None
    user, role_name = rows[0]
    return user, role_name


async def find_user_by_id(
    session: AsyncSession, *, organization_id: UUID, user_id: UUID
) -> tuple[User, str] | None:
    stmt = _users_with_roles().where(
        User.organization_id == organization_id, User.user_id == user_id
    )
    row = (await session.execute(stmt)).one_or_none()
    return (row[0], row[1]) if row else None
