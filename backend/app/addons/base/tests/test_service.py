"""Service-layer tests for the base addon.

Features: F1, F2. Requirements: R1, R2, R3, R4."""

from app.addons.base import repository, service
from app.core.roles import Role
from app.core.security import TokenClaims
from app.core.tenancy import TenantContext


def context(tenant, role: Role = Role.OWNER) -> TenantContext:
    return TenantContext(tenant.organization_id, tenant.users[role], role)


async def test_user_listing_is_scoped_even_on_an_unbound_session(sessions, tenants):
    first, second = tenants
    async with sessions() as session:
        rows = await repository.list_users(session, organization_id=first.organization_id)
        assert {user.user_id for user, _ in rows} == set(first.users.values())
        people = await service.list_people(session, context(first))
        assert {person.user_id for person in people} == set(first.users.values())
        assert all(person.organization_id == first.organization_id for person in people)


async def test_identity_contract_ignores_ids_from_another_organization(sessions, tenants):
    first, second = tenants
    async with sessions() as session:
        identity = service.IdentityService(session)
        wanted = [first.users[Role.OWNER], second.users[Role.OWNER]]
        found = await identity.get_users(context(first), wanted)
        assert set(found) == {first.users[Role.OWNER]}
        summary = found[first.users[Role.OWNER]]
        assert (summary.role, summary.is_active, summary.full_name) == (
            Role.OWNER,
            True,
            "Acme owner",
        )


async def test_current_user_reuses_the_identity_check_lookup(sessions, tenants, monkeypatch):
    first, _ = tenants
    lookups = 0
    original = repository.find_user_by_id

    async def counted(*args, **kwargs):
        nonlocal lookups
        lookups += 1
        return await original(*args, **kwargs)

    monkeypatch.setattr(repository, "find_user_by_id", counted)
    async with sessions() as session:
        claims = TokenClaims(first.users[Role.OWNER], first.organization_id, Role.OWNER)
        await service.check_identity(session, claims)
        me = await service.current_user(session, context(first))
    assert me.user_id == first.users[Role.OWNER]
    assert lookups == 1
