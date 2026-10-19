"""Bypasses found in review of the tenancy layer. Each one reached tenant B
before it was fixed, so each stays as a regression test."""

import uuid

import pytest
from sqlalchemy import ForeignKey, String, Uuid, insert, select, update
from sqlalchemy.orm import Mapped, make_transient_to_detached, mapped_column, relationship

from app.addons.base.models import Organization, User
from app.core.db import Base, UUIDPrimaryKey
from app.core.errors import CrossTenantWrite
from app.core.roles import Role
from app.core.tenancy import TenantContext, TenantScoped, bind_session, get_tenant_session


class _Gadget(UUIDPrimaryKey, TenantScoped, Base):
    """Test-only pair of tenant tables with a foreign key between them."""

    __tablename__ = "test_gadget"
    name: Mapped[str] = mapped_column(String(50))


class _Widget(UUIDPrimaryKey, TenantScoped, Base):
    __tablename__ = "test_widget"
    gadget_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("test_gadget.id"))
    gadget: Mapped[_Gadget] = relationship()


async def _gadget(sessions, organization_id, name):
    async with sessions() as session:
        g = _Gadget(organization_id=organization_id, name=name)
        session.add(g)
        await session.commit()
        return g.id


async def test_bulk_update_by_primary_key_is_refused(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        with pytest.raises(CrossTenantWrite):
            await session.execute(update(User), [{"id": b.owner_id, "full_name": "hijacked"}])


async def test_update_cannot_set_organization_id(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        with pytest.raises(CrossTenantWrite):
            await session.execute(
                update(User)
                .where(User.id == a.sales_id)
                .values(organization_id=b.organization_id)
            )


async def test_orm_insert_statement_is_refused(sessions, tenants):
    a, b = tenants
    row = {
        "organization_id": b.organization_id,
        "email": "x@b.test",
        "full_name": "",
        "password_hash": "x",
        "role": Role.SALES,
        "is_active": True,
    }
    async with sessions() as session:
        bind_session(session, a.organization_id)
        with pytest.raises(CrossTenantWrite):
            await session.execute(insert(User).values(**row))
        with pytest.raises(CrossTenantWrite):
            await session.execute(insert(User), [row])


async def test_legacy_bulk_methods_are_refused(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        with pytest.raises(CrossTenantWrite):
            await session.run_sync(
                lambda s: s.bulk_update_mappings(User, [{"id": b.owner_id, "full_name": "x"}])
            )


async def test_forged_object_cannot_update_other_tenant_by_primary_key(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        forged = User(
            id=b.owner_id,
            organization_id=a.organization_id,
            email="owner@northstar.test",
            full_name="hijacked",
            password_hash="x",
            role=Role.OWNER,
        )
        make_transient_to_detached(forged)
        merged = await session.merge(forged, load=False)
        merged.full_name = "hijacked-again"
        with pytest.raises(CrossTenantWrite):
            await session.flush()


async def test_foreign_key_to_other_tenant_is_refused(sessions, tenants):
    a, b = tenants
    b_gadget = await _gadget(sessions, b.organization_id, "b-secret")
    async with sessions() as session:
        bind_session(session, a.organization_id)
        session.add(_Widget(gadget_id=b_gadget))
        with pytest.raises(CrossTenantWrite):
            await session.flush()


async def test_foreign_key_inside_own_tenant_is_accepted(sessions, tenants):
    a, _ = tenants
    a_gadget = await _gadget(sessions, a.organization_id, "a-own")
    async with sessions() as session:
        bind_session(session, a.organization_id)
        widget = _Widget(gadget_id=a_gadget)
        session.add(widget)
        await session.flush()
        await session.refresh(widget, ["gadget"])
        assert widget.gadget.name == "a-own"


async def test_new_rows_referencing_each_other_in_one_flush_are_accepted(sessions, tenants):
    a, _ = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        gadget = _Gadget(id=uuid.uuid4(), name="new")
        session.add_all([gadget, _Widget(gadget_id=gadget.id)])
        await session.flush()


async def test_organization_table_is_scoped(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        assert [o.id for o in await session.scalars(select(Organization))] == [a.organization_id]
        assert await session.get(Organization, b.organization_id) is None
        await session.execute(
            update(Organization).where(Organization.id == b.organization_id).values(name="x")
        )
        await session.commit()
    async with sessions() as session:
        assert (await session.get(Organization, b.organization_id)).name == "Northstar Parts"


async def test_bound_session_cannot_create_an_organization(sessions, tenants):
    a, _ = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        session.add(Organization(name="Shadow Co"))
        with pytest.raises(CrossTenantWrite):
            await session.flush()


# Transaction ownership: get_tenant_session commits on success, rolls back on error.


async def _drive(sessions, ctx, body):
    async with sessions() as session:
        gen = get_tenant_session(ctx, session)
        s = await anext(gen)
        try:
            await body(s)
        except ValueError as exc:
            with pytest.raises(ValueError):
                await gen.athrow(exc)
        else:
            with pytest.raises(StopAsyncIteration):
                await anext(gen)


async def test_tenant_session_commits_when_the_route_returns(sessions, tenants):
    a, _ = tenants
    ctx = TenantContext(a.organization_id, a.owner_id, Role.OWNER)

    async def rename(s):
        (await s.get(User, a.sales_id)).full_name = "Renamed"

    await _drive(sessions, ctx, rename)
    async with sessions() as session:
        assert (await session.get(User, a.sales_id)).full_name == "Renamed"


async def test_tenant_session_rolls_back_when_the_route_raises(sessions, tenants):
    a, _ = tenants
    ctx = TenantContext(a.organization_id, a.owner_id, Role.OWNER)

    async def rename_then_fail(s):
        (await s.get(User, a.sales_id)).full_name = "Renamed"
        await s.flush()
        raise ValueError("route failed")

    await _drive(sessions, ctx, rename_then_fail)
    async with sessions() as session:
        assert (await session.get(User, a.sales_id)).full_name == "Acme Supply Sales"
