"""Cross-tenant isolation tests for the base addon.

Features: F1, F2. Requirements: R1, R2, R3, R4.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""

from app.addons.base import repository


async def test_list_users_is_scoped_without_the_session_hook(sessions, tenants):
    acme, _ = tenants
    # An unbound session, as a script or worker would use: only the query's own
    # organization_id predicate keeps the other tenant's users out.
    async with sessions() as session:
        rows = await repository.list_users(session, organization_id=acme.organization_id)

    assert rows
    assert {user.organization_id for user, _ in rows} == {acme.organization_id}
