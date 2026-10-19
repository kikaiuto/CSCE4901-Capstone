"""Password hashing and JWT issuance and verification.

The access token carries the user id, organization id, and role (S-01 note 2).
TenantMiddleware reads it on every request through core.tenancy.

Password hashing (Argon2id, m=65536, t=3, p=4) is S1-PLT-01 and lands here next.

Features: F1, F2. Requirements: R2, R3. Non-functional: NF7.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import get_settings
from app.core.errors import Unauthorized
from app.core.roles import Role

ALGORITHM = "HS256"


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
        "exp": issued + timedelta(minutes=settings.jwt_expiry_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> TokenClaims:
    """Verify signature and expiry, then parse the claims.

    Every failure raises the same Unauthorized, so a caller cannot tell an
    expired token from a forged one.
    """
    try:
        payload = jwt.decode(
            token,
            get_settings().jwt_secret,
            algorithms=[ALGORITHM],
            options={"require": ["sub", "org", "role", "exp"]},
        )
        return TokenClaims(
            user_id=uuid.UUID(payload["sub"]),
            organization_id=uuid.UUID(payload["org"]),
            role=Role(payload["role"]),
        )
    except (jwt.InvalidTokenError, ValueError, TypeError) as exc:
        raise Unauthorized("Invalid or expired token") from exc
