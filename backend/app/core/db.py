"""Async SQLAlchemy 2.0 engine, session factory, and declarative base."""

from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session

from app.core.config import get_settings
from app.core.errors import CrossTenantWrite


class Base(DeclarativeBase):
    pass


# Session.info key holding the organization a session is bound to (core.tenancy).
ORGANIZATION_KEY = "organization_id"


class TenantSafeSession(Session):
    """Refuses the legacy bulk_* methods on a tenant-bound session.

    They write without passing through the do_orm_execute or before_flush hooks
    that core.tenancy scopes, so on a bound session they could reach another
    tenant's rows. Use session.add or update().where() instead.
    """

    def _refuse_if_bound(self, method: str) -> None:
        if self.info.get(ORGANIZATION_KEY) is not None:
            raise CrossTenantWrite(f"Session.{method} is not tenant-scoped; use session.add")

    def bulk_save_objects(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        self._refuse_if_bound("bulk_save_objects")
        return super().bulk_save_objects(*args, **kwargs)

    def bulk_insert_mappings(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        self._refuse_if_bound("bulk_insert_mappings")
        return super().bulk_insert_mappings(*args, **kwargs)

    def bulk_update_mappings(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        self._refuse_if_bound("bulk_update_mappings")
        return super().bulk_update_mappings(*args, **kwargs)


@lru_cache
def get_engine() -> AsyncEngine:
    return create_async_engine(get_settings().database_url, pool_pre_ping=True)


@lru_cache
def get_session_factory() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        get_engine(), expire_on_commit=False, sync_session_class=TenantSafeSession
    )


async def get_session() -> AsyncIterator[AsyncSession]:
    """An unscoped session. Only sign-in and organization creation use this
    directly; every tenant route takes get_tenant_session from core.tenancy."""
    async with get_session_factory()() as session:
        yield session
