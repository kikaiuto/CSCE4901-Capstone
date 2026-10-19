"""Tenant resolution and organization_id scoping enforced on every query.

This is TenantMiddleware from the design (FND-03). It has two halves:

1. get_tenant_context reads the Bearer JWT and yields the caller's organization,
   user, and role. core.modules.loading mounts every addon router behind it, so
   no tenant route can be written outside it.

2. get_tenant_session hands a route an AsyncSession bound to that organization,
   and owns the request's transaction: it commits when the route returns and
   rolls back when it raises. Contract implementations flush, never commit.

On a bound session:

- every ORM SELECT, UPDATE, and DELETE gets "organization_id = <bound org>" on
  each TenantScoped entity, and "id = <bound org>" on the Organization table,
  including relationship and lazy loads;
- a flush may only insert, change, or delete rows of the bound organization. A
  changed or deleted row is re-checked against the database under the filter,
  so an object forged into the session (merge(load=False)) cannot reach
  another tenant's row by primary key;
- a foreign key from a TenantScoped row to another TenantScoped table must point
  at a row of the same organization;
- the statement forms the filter cannot cover are refused with CrossTenantWrite:
  ORM insert() (use session.add), UPDATE or DELETE with a list of parameter
  sets ("bulk by primary key"), and an UPDATE that sets organization_id.

A repository cannot forget the filter, which is the weakness the design
rationale calls out for a shared schema. Two things are outside the guarantee:
textual SQL, banned by CLAUDE.md. The legacy Session.bulk_* methods, which skip
both hooks, raise on a bound session (core.db.TenantSafeSession).

Requirements: R1, R4. Non-functional: NF4.
"""

import uuid
from collections import defaultdict
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Annotated, Any

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import ForeignKey, Uuid, event, inspect, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, ORMExecuteState, Session, mapped_column, with_loader_criteria

from app.core.db import ORGANIZATION_KEY, Base, get_session
from app.core.errors import CrossTenantWrite, Unauthorized
from app.core.roles import Role
from app.core.security import decode_access_token

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True, slots=True)
class TenantContext:
    organization_id: uuid.UUID
    user_id: uuid.UUID
    role: Role


class TenantScoped:
    """Mixin for every table that belongs to one organization.

    Every operational table carries organization_id (CLAUDE.md), so every model
    outside Organization itself inherits this.
    """

    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organization.id", ondelete="RESTRICT"), index=True, nullable=False
    )


class TenantRoot:
    """Mixin for the tenant table itself. A bound session sees and changes only
    its own organization's row."""

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)


async def get_tenant_context(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> TenantContext:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise Unauthorized("Sign in to continue")
    claims = decode_access_token(credentials.credentials)
    return TenantContext(
        organization_id=claims.organization_id, user_id=claims.user_id, role=claims.role
    )


def bind_session(session: AsyncSession | Session, organization_id: uuid.UUID) -> None:
    """Scope a session to one organization for the rest of its life.

    Rebinding a session to a different organization is refused: a session that
    has already loaded one tenant's rows must not start serving another's.
    """
    current = session.info.get(ORGANIZATION_KEY)
    if current is not None and current != organization_id:
        raise CrossTenantWrite("Session is already bound to another organization")
    session.info[ORGANIZATION_KEY] = organization_id


async def get_tenant_session(
    ctx: Annotated[TenantContext, Depends(get_tenant_context)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AsyncIterator[AsyncSession]:
    bind_session(session, ctx.organization_id)
    try:
        yield session
    except BaseException:
        await session.rollback()
        raise
    else:
        await session.commit()


def _is_tenant_class(cls: Any) -> bool:
    return isinstance(cls, type) and issubclass(cls, (TenantScoped, TenantRoot))


def _criteria(organization_id: uuid.UUID) -> tuple[Any, ...]:
    return (
        with_loader_criteria(
            TenantScoped,
            lambda cls: cls.organization_id == organization_id,
            include_aliases=True,
        ),
        with_loader_criteria(
            TenantRoot, lambda cls: cls.id == organization_id, include_aliases=True
        ),
    )


def _sets_organization_id(state: ORMExecuteState) -> bool:
    keys: set[str] = set()
    # Update._values is the .values(...) mapping; SQLAlchemy has no public accessor.
    for key in (getattr(state.statement, "_values", None) or {}).keys():
        keys.add(getattr(key, "key", None) or getattr(key, "name", None) or str(key))
    if isinstance(state.parameters, dict):
        keys.update(state.parameters)
    return "organization_id" in keys


@event.listens_for(Session, "do_orm_execute")
def _scope_statement(state: ORMExecuteState) -> None:
    organization_id = state.session.info.get(ORGANIZATION_KEY)
    if organization_id is None:
        return
    target = state.bind_mapper.class_ if state.bind_mapper is not None else None

    if state.is_insert:
        if _is_tenant_class(target):
            raise CrossTenantWrite("Use session.add, not insert(), on a tenant-bound session")
        return
    if state.is_update or state.is_delete:
        if _is_tenant_class(target):
            if isinstance(state.parameters, list | tuple):
                raise CrossTenantWrite(
                    "Bulk UPDATE/DELETE by primary key is not tenant-scoped; use .where()"
                )
            if state.is_update and _sets_organization_id(state):
                raise CrossTenantWrite("An UPDATE may not change organization_id")
    elif not state.is_select:
        return
    state.statement = state.statement.options(*_criteria(organization_id))


def _tenant_class_for_table(table: Any) -> type | None:
    for mapper in Base.registry.mappers:
        if mapper.local_table is table and issubclass(mapper.class_, TenantScoped):
            return mapper.class_
    return None


def _existing_ids(session: Session, cls: type, ids: set[uuid.UUID]) -> set[uuid.UUID]:
    """Ids of cls that exist in the bound organization (the filter applies)."""
    with session.no_autoflush:
        rows = session.execute(select(cls.id).where(cls.id.in_(ids)))
        return set(rows.scalars())


@event.listens_for(Session, "before_flush")
def _guard_writes(session: Session, _flush_context: object, _instances: object) -> None:
    organization_id = session.info.get(ORGANIZATION_KEY)
    if organization_id is None:
        return

    pending: dict[type, set[uuid.UUID]] = defaultdict(set)
    for obj in session.new:
        if isinstance(obj, TenantRoot):
            raise CrossTenantWrite("Organizations are created on an unbound session")
        if isinstance(obj, TenantScoped):
            if obj.organization_id is None:
                obj.organization_id = organization_id
            elif obj.organization_id != organization_id:
                raise CrossTenantWrite("Refused to insert a row into another organization")
            if getattr(obj, "id", None) is not None:
                pending[type(obj)].add(obj.id)

    changed = [o for o in session.dirty if session.is_modified(o)]
    to_verify: dict[type, set[uuid.UUID]] = defaultdict(set)
    for obj in (*changed, *session.deleted):
        if isinstance(obj, TenantRoot) and obj.id != organization_id:
            raise CrossTenantWrite("Refused to change another organization")
        if isinstance(obj, TenantScoped):
            if obj.organization_id != organization_id:
                raise CrossTenantWrite("Refused to change a row in another organization")
            to_verify[type(obj)].add(inspect(obj).identity[0])

    # Foreign keys from tenant rows must point inside the same organization.
    for obj in (*session.new, *changed):
        if not isinstance(obj, TenantScoped):
            continue
        state = inspect(obj)
        for column in state.mapper.columns:
            for fk in column.foreign_keys:
                target_cls = _tenant_class_for_table(fk.column.table)
                if target_cls is None:
                    continue
                prop = state.mapper.get_property_by_column(column)
                value = getattr(obj, prop.key)
                if value is None:
                    continue
                if not state.pending and not state.attrs[prop.key].history.has_changes():
                    continue
                if value not in pending[target_cls]:
                    to_verify[target_cls].add(value)

    for cls, ids in to_verify.items():
        missing = ids - _existing_ids(session, cls, ids)
        if missing:
            raise CrossTenantWrite(
                f"{cls.__name__} row(s) outside this organization: {sorted(map(str, missing))}"
            )
