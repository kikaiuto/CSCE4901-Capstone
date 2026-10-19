"""JWT issue and verify. Requirements: R2. Non-functional: NF7."""

import uuid
from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.config import get_settings
from app.core.errors import Unauthorized
from app.core.roles import Role
from app.core.security import ALGORITHM, TokenClaims, decode_access_token, issue_access_token

CLAIMS = TokenClaims(user_id=uuid.uuid4(), organization_id=uuid.uuid4(), role=Role.SALES)


def test_round_trip_carries_user_organization_and_role():
    assert decode_access_token(issue_access_token(CLAIMS)) == CLAIMS


def test_expired_token_is_rejected():
    issued = datetime.now(UTC) - timedelta(minutes=get_settings().jwt_expiry_minutes + 1)
    with pytest.raises(Unauthorized):
        decode_access_token(issue_access_token(CLAIMS, now=issued))


def test_token_signed_with_another_secret_is_rejected():
    payload = {"sub": str(CLAIMS.user_id), "org": str(CLAIMS.organization_id),
               "role": "owner", "exp": datetime.now(UTC) + timedelta(minutes=5)}
    forged = jwt.encode(payload, "a-different-secret-that-is-also-32-bytes", algorithm=ALGORITHM)
    with pytest.raises(Unauthorized):
        decode_access_token(forged)


def test_unsigned_token_is_rejected():
    payload = {"sub": str(CLAIMS.user_id), "org": str(CLAIMS.organization_id),
               "role": "owner", "exp": datetime.now(UTC) + timedelta(minutes=5)}
    with pytest.raises(Unauthorized):
        decode_access_token(jwt.encode(payload, key=None, algorithm="none"))


@pytest.mark.parametrize("missing", ["sub", "org", "role", "exp"])
def test_token_missing_a_claim_is_rejected(missing):
    payload = {"sub": str(CLAIMS.user_id), "org": str(CLAIMS.organization_id),
               "role": "owner", "exp": datetime.now(UTC) + timedelta(minutes=5)}
    del payload[missing]
    token = jwt.encode(payload, get_settings().jwt_secret, algorithm=ALGORITHM)
    with pytest.raises(Unauthorized):
        decode_access_token(token)


def test_unknown_role_is_rejected():
    payload = {"sub": str(CLAIMS.user_id), "org": str(CLAIMS.organization_id),
               "role": "superuser", "exp": datetime.now(UTC) + timedelta(minutes=5)}
    token = jwt.encode(payload, get_settings().jwt_secret, algorithm=ALGORITHM)
    with pytest.raises(Unauthorized):
        decode_access_token(token)
