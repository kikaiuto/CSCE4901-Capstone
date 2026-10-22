"""Password hashing and JWT issuance and verification.

The access token carries the user id, organization id, and role (S-01 note 2).
TenantMiddleware reads it on every request through core.tenancy.

Features: F1, F2. Requirements: R2, R3. Non-functional: NF7.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHashError, VerificationError

from app.core.config import get_settings
from app.core.errors import Unauthorized
from app.core.roles import Role

ALGORITHM = "HS256"
ISSUER = "sector7"
AUDIENCE = "sector7-api"
_hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4, type=Type.ID)


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        return _hasher.verify(stored_hash, password)
    except (VerificationError, InvalidHashError):
        return False


def _jwt_secret() -> str:
    secret = get_settings().jwt_secret
    if len(secret.encode("utf-8")) < 32:
        raise RuntimeError("Set JWT_SECRET to at least 32 bytes before using authentication")
    return secret


@dataclass(frozen=True, slots=True)
class TokenClaims:
    user_id: uuid.UUID
    organization_id: uuid.UUID
    role: Role


def issue_access_token(claims: TokenClaims, *, now: datetime | None = None) -> str:
    settings = get_settings()
    issued = now or datetime.now(UTC)
    payload = {
        "sub": str(claims.user_id),
        "org": str(claims.organization_id),
        "role": claims.role.value,
        "iat": issued,
        "nbf": issued,
        "exp": issued + timedelta(minutes=settings.jwt_expiry_minutes),
        "iss": ISSUER,
        "aud": AUDIENCE,
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> TokenClaims:
    """Verify signature and expiry, then parse the claims.

    Every failure raises the same Unauthorized, so a caller cannot tell an
    expired token from a forged one.
    """
    try:
        payload = jwt.decode(
            token,
            _jwt_secret(),
            algorithms=[ALGORITHM],
            issuer=ISSUER,
            audience=AUDIENCE,
            options={"require": ["sub", "org", "role", "exp", "iat", "nbf", "iss", "aud"]},
        )
        if not all(isinstance(payload[key], str) for key in ("sub", "org", "role")):
            raise ValueError("Identity claims must be strings")
        return TokenClaims(
            user_id=uuid.UUID(payload["sub"]),
            organization_id=uuid.UUID(payload["org"]),
            role=Role(payload["role"]),
        )
    except (jwt.InvalidTokenError, ValueError, TypeError) as exc:
        raise Unauthorized("Invalid or expired token") from exc
