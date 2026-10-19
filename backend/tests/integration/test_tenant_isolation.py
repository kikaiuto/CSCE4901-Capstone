"""Tenant A cannot read or write one row of tenant B.

The Sprint 1 check-in criterion, proven at both layers: the session, where the
organization filter is added centrally, and HTTP, where a token is the only
source of the organization. Requirements: R1. Non-functional: NF4, NF5.
"""

import uuid

import pytest
from sqlalchemy import func, select, update

from app.addons.base.models import Organization, User
from app.core.errors import CrossTenantWrite
from app.core.roles import Role
from app.core.tenancy import bind_session


async def test_select_returns_only_own_rows(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        users = (await session.scalars(select(User))).all()
    assert {u.organization_id for u in users} == {a.organization_id}
    assert len(users) == 2


async def test_explicit_filter_on_other_tenant_returns_nothing(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        rows = (
            await session.scalars(select(User).where(User.organization_id == b.organization_id))
        ).all()
    assert rows == []


async def test_get_by_primary_key_of_other_tenant_is_none(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        assert await session.get(User, b.owner_id) is None
        assert await session.get(User, a.owner_id) is not None


async def test_aggregates_are_scoped(sessions, tenants):
    a, _ = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        count = await session.scalar(select(func.count()).select_from(User))
    assert count == 2


async def test_update_where_cannot_reach_other_tenant(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        await session.execute(
            update(User).where(User.id == b.owner_id).values(full_name="hijacked")
        )
        await session.commit()
    async with sessions() as session:
        owner_b = await session.get(User, b.owner_id)
    assert owner_b.full_name != "hijacked"


async def test_insert_into_other_tenant_is_refused(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        session.add(
            User(
                organization_id=b.organization_id,
                email="intruder@acme.test",
                password_hash="x",
                role=Role.SALES,
            )
        )
        with pytest.raises(CrossTenantWrite):
            await session.flush()


async def test_insert_without_organization_takes_the_bound_one(sessions, tenants):
    a, _ = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        user = User(email="new@acme.test", password_hash="x", role=Role.SALES)
        session.add(user)
        await session.flush()
        assert user.organization_id == a.organization_id


async def test_moving_a_row_to_other_tenant_is_refused(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        user = await session.get(User, a.sales_id)
        user.organization_id = b.organization_id
        with pytest.raises(CrossTenantWrite):
            await session.flush()


async def test_session_cannot_be_rebound_to_another_tenant(sessions, tenants):
    a, b = tenants
    async with sessions() as session:
        bind_session(session, a.organization_id)
        with pytest.raises(CrossTenantWrite):
            bind_session(session, b.organization_id)


async def test_unbound_session_sees_everything(sessions, tenants):
    """Sign-in needs this: it looks a user up by email before a tenant exists.
    Only get_session hands out an unbound session, and only public routes use it."""
    async with sessions() as session:
        assert await session.scalar(select(func.count()).select_from(User)) == 4
        assert await session.scalar(select(func.count()).select_from(Organization)) == 2


# HTTP layer


async def test_api_lists_only_callers_people(client, tenants):
    a, b = tenants
    resp = await client.get("/api/base/users", headers=a.headers())
    assert resp.status_code == 200
    ids = {uuid.UUID(u["id"]) for u in resp.json()}
    assert ids == {a.owner_id, a.sales_id}
    assert "password_hash" not in resp.json()[0]

    resp = await client.get("/api/base/users", headers=b.headers())
    assert {uuid.UUID(u["id"]) for u in resp.json()} == {b.owner_id, b.sales_id}


async def test_api_requires_a_token(client, tenants):
    resp = await client.get("/api/base/users")
    assert resp.status_code == 401
    assert resp.headers["www-authenticate"] == "Bearer"


async def test_api_rejects_a_forged_token(client, tenants):
    a, _ = tenants
    token = a.token()
    forged = token[:-4] + ("AAAA" if not token.endswith("AAAA") else "BBBB")
    resp = await client.get("/api/base/users", headers={"Authorization": f"Bearer {forged}"})
    assert resp.status_code == 401


async def test_api_enforces_role(client, tenants):
    a, _ = tenants
    resp = await client.get("/api/base/users", headers=a.headers(Role.SALES))
    assert resp.status_code == 403
