"""Password and token validation at the authentication boundary."""

import uuid
from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.config import get_settings
from app.core.errors import Unauthorized
from app.core.roles import Role
from app.core.security import (
    ALGORITHM,
    TokenClaims,
    decode_access_token,
    hash_password,
    issue_access_token,
    verify_password,
)

CLAIMS = TokenClaims(user_id=uuid.uuid4(), organization_id=uuid.uuid4(), role=Role.SALES)


def valid_payload():
    return jwt.decode(issue_access_token(CLAIMS), options={"verify_signature": False})


def sign(payload):
    return jwt.encode(payload, get_settings().jwt_secret, algorithm=ALGORITHM)


def test_round_trip_carries_user_organization_and_role():
    assert decode_access_token(issue_access_token(CLAIMS)) == CLAIMS


def test_password_hash_is_salted_argon2id():
    first = hash_password("test password")
    second = hash_password("test password")
    assert first.startswith("$argon2id$v=19$m=65536,t=3,p=4$")
    assert first != second
    assert verify_password("test password", first)
    assert not verify_password("wrong password", first)
    assert not verify_password("test password", "malformed hash")


def test_expired_token_is_rejected():
    issued = datetime.now(UTC) - timedelta(minutes=get_settings().jwt_expiry_minutes + 1)
    with pytest.raises(Unauthorized):
        decode_access_token(issue_access_token(CLAIMS, now=issued))


def test_token_signed_with_another_secret_is_rejected():
    forged = jwt.encode(
        valid_payload(), "a-different-secret-that-is-also-32-bytes", algorithm=ALGORITHM
    )
    with pytest.raises(Unauthorized):
        decode_access_token(forged)


def test_unsigned_token_is_rejected():
    with pytest.raises(Unauthorized):
        decode_access_token(jwt.encode(valid_payload(), key=None, algorithm="none"))


@pytest.mark.parametrize("missing", ["sub", "org", "role", "exp", "iat", "nbf", "iss", "aud"])
def test_token_missing_a_claim_is_rejected(missing):
    payload = valid_payload()
    del payload[missing]
    with pytest.raises(Unauthorized):
        decode_access_token(sign(payload))


@pytest.mark.parametrize(
    ("claim", "value"),
    [
        ("role", "superuser"),
        ("role", ["owner"]),
        ("sub", "not-a-uuid"),
        ("org", "not-a-uuid"),
        ("org", 42),
        ("org", {"id": "not-a-uuid"}),
        ("iss", "another-application"),
        ("aud", "another-api"),
    ],
)
def test_invalid_claims_are_rejected(claim, value):
    payload = valid_payload()
    payload[claim] = value
    with pytest.raises(Unauthorized):
        decode_access_token(sign(payload))


def test_future_token_is_rejected():
    with pytest.raises(Unauthorized):
        decode_access_token(
            issue_access_token(CLAIMS, now=datetime.now(UTC) + timedelta(minutes=5))
        )


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("Owner", Role.OWNER),
        ("OWNER", Role.OWNER),
        ("Warehouse", Role.INVENTORY),
        ("Inventory", Role.INVENTORY),
        ("Purchasing", Role.PURCHASING),
    ],
)
def test_existing_database_role_names_are_supported(name, expected):
    assert Role(name) is expected
