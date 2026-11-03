"""Cross-tenant isolation tests for the base addon.

Features: F1, F2. Requirements: R1, R2, R3, R4.
A request carrying tenant A's JWT must never read one row belonging to
tenant B. Non-functional: NF5.
"""

from app.core.roles import Role
from app.core.security import TokenClaims, issue_access_token


async def test_user_list_is_tenant_scoped_and_restricted(client, tenants):
    first, second = tenants
    response = await client.get("/api/base/users", headers=first.headers())
    assert response.status_code == 200
    assert {row["user_id"] for row in response.json()} == {str(uid) for uid in first.users.values()}
    assert not {str(uid) for uid in second.users.values()} & {
        row["user_id"] for row in response.json()
    }
    forbidden = await client.get("/api/base/users", headers=first.headers(Role.SALES))
    assert forbidden.status_code == 403


async def test_signed_token_cannot_mix_a_user_and_another_organization(client, tenants):
    first, second = tenants
    token = issue_access_token(
        TokenClaims(first.users[Role.OWNER], second.organization_id, Role.OWNER)
    )
    response = await client.get("/api/base/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
