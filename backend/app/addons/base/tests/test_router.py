"""Route contract tests for the base addon.

Features: F1, F2. Requirements: R1, R2, R3, R4."""

import uuid

import pytest

from app.addons.base import service
from app.addons.base.models import Role as UserRole
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
        "full_name": "Acme owner",
        "is_active": True,
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


@pytest.mark.parametrize("path", ["missing", "inactive"])
async def test_every_failed_login_pays_for_a_password_check(
    client, sessions, tenants, monkeypatch, path
):
    first, _ = tenants
    if path == "inactive":
        async with sessions() as session:
            user = await session.get(User, first.users[Role.OWNER])
            user.is_active = False
            await session.commit()
    checked: list[str] = []

    def spy(password: str, stored_hash: str) -> bool:
        checked.append(stored_hash)
        return True

    monkeypatch.setattr(service, "verify_password", spy)
    email = "missing@example.test" if path == "missing" else first.owner_email
    response = await login(client, first, email=email)
    assert response.status_code == 401
    assert len(checked) == 1
    assert checked[0].startswith("$argon2id$")


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


async def test_mixed_case_email_is_stored_lowercase_and_can_log_in(client, sessions, tenants):
    first, _ = tenants
    async with sessions() as session:
        user = await session.get(User, first.users[Role.OWNER])
        user.email = "  Mixed.Case@Example.TEST "
        await session.commit()
        assert user.email == "mixed.case@example.test"
    response = await login(client, first, email="Mixed.Case@Example.TEST")
    assert response.status_code == 200


async def test_user_list_carries_what_the_people_screen_shows(client, sessions, tenants):
    first, _ = tenants
    async with sessions() as session:
        user = await session.get(User, first.users[Role.SALES])
        user.is_active = False
        await session.commit()
    response = await client.get("/api/base/users", headers=first.headers())
    assert response.status_code == 200
    by_id = {row["user_id"]: row for row in response.json()}
    assert by_id[str(first.users[Role.OWNER])] == {
        "user_id": str(first.users[Role.OWNER]),
        "organization_id": str(first.organization_id),
        "role": "owner",
        "email": first.owner_email,
        "full_name": "Acme owner",
        "is_active": True,
    }
    assert by_id[str(first.users[Role.SALES])]["is_active"] is False


async def test_a_row_with_an_unknown_role_name_does_not_break_the_listing(
    client, sessions, tenants
):
    first, _ = tenants
    async with sessions() as session:
        manager = UserRole(organization_id=first.organization_id, name="Manager")
        session.add(manager)
        await session.flush()
        user = await session.get(User, first.users[Role.SALES])
        user.role_id = manager.role_id
        await session.commit()
    response = await client.get("/api/base/users", headers=first.headers())
    assert response.status_code == 200
    listed = {row["user_id"] for row in response.json()}
    assert str(first.users[Role.SALES]) not in listed
    assert listed == {str(uid) for role, uid in first.users.items() if role is not Role.SALES}
