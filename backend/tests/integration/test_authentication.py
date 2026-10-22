import uuid

import pytest

from app.addons.base.models import User
from app.core.roles import Role
from app.core.security import TokenClaims, issue_access_token
from tests.conftest import PASSWORD


async def login(client, tenant, **changes):
    payload = {
        "organization_id": str(tenant.organization_id),
        "email": tenant.owner_email,
        "password": PASSWORD,
    }
    return await client.post("/api/base/auth/login", json=payload | changes)


async def test_login_token_can_access_current_user(client, tenants):
    first, _ = tenants
    response = await login(client, first, email=f"  {first.owner_email.upper()}  ")
    assert response.status_code == 200
    token = response.json()["access_token"]
    me = await client.get("/api/base/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json() == {
        "organization_id": str(first.organization_id),
        "user_id": str(first.users[Role.OWNER]),
        "role": "owner",
        "email": first.owner_email,
    }


async def test_invalid_credentials_share_one_response(client, tenants):
    first, second = tenants
    responses = [
        await login(client, first, password="wrong"),
        await login(client, first, email="missing@example.test"),
        await login(client, first, organization_id=str(second.organization_id)),
    ]
    assert all(response.status_code == 401 for response in responses)
    assert all(response.json() == responses[0].json() for response in responses)


@pytest.mark.parametrize("change", ["deactivate", "delete", "role"])
async def test_account_changes_invalidate_existing_tokens(client, sessions, tenants, change):
    first, _ = tenants
    headers = first.headers()
    async with sessions() as session:
        user = await session.get(User, first.users[Role.OWNER])
        if change == "deactivate":
            user.is_active = False
        elif change == "delete":
            await session.delete(user)
        else:
            user.role_id = first.roles[Role.SALES]
        await session.commit()
    response = await client.get("/api/base/auth/me", headers=headers)
    assert response.status_code == 401


async def test_inactive_account_cannot_log_in(client, sessions, tenants):
    first, _ = tenants
    async with sessions() as session:
        user = await session.get(User, first.users[Role.OWNER])
        user.is_active = False
        await session.commit()
    assert (await login(client, first)).status_code == 401


async def test_valid_signature_is_not_enough_for_a_nonexistent_account(client, tenants):
    first, _ = tenants
    token = issue_access_token(TokenClaims(uuid.uuid4(), first.organization_id, Role.OWNER))
    response = await client.get("/api/base/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


async def test_another_organization_cannot_be_selected_in_a_query(client, tenants):
    first, second = tenants
    response = await client.get(
        "/api/base/auth/me",
        params={"organization_id": str(second.organization_id)},
        headers=first.headers(),
    )
    assert response.json()["organization_id"] == str(first.organization_id)
