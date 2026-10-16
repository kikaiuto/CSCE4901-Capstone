"""Password hashing and short-lived signed access tokens for Sector 7."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHashError, VerifyMismatchError, VerificationError

from app.core.config import get_settings

ISSUER = "sector7"
AUDIENCE = "sector7-api"
ALGORITHM = "HS256"
_hasher = PasswordHasher(
    time_cost=3, memory_cost=65536, parallelism=4,
    hash_len=32, salt_len=16, type=Type.ID,
)


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        return _hasher.verify(stored_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def _jwt_secret() -> str:
    secret = get_settings().jwt_secret
    if len(secret.encode("utf-8")) < 32 or secret == "change-me":
        raise RuntimeError("Set JWT_SECRET to at least 32 random bytes before using authentication")
    return secret


def create_access_token(*, user_id: UUID, organization_id: UUID, role: str) -> str:
    now = datetime.now(UTC)
    minutes = get_settings().jwt_expiry_minutes
    if not 1 <= minutes <= 1440:
        raise RuntimeError("JWT_EXPIRY_MINUTES must be between 1 and 1440")
    payload = {
        "sub": str(user_id),
        "org": str(organization_id),
        "role": role,
        "iss": ISSUER,
        "aud": AUDIENCE,
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(minutes=minutes),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        _jwt_secret(),
        algorithms=[ALGORITHM],
        issuer=ISSUER,
        audience=AUDIENCE,
        options={"require": ["sub", "org", "role", "iss", "aud", "exp", "iat", "nbf"]},
    )
