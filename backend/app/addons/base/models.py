"""SQLAlchemy 2.0 ORM models for the base addon.

Organization is the tenant itself, so it is the one table without an
organization_id. Every other table in every addon is TenantScoped.

The user table is named user_account because "user" is a reserved word in
PostgreSQL. Email is unique across the whole system, not per organization,
because sign-in (S-01) takes an email and a password and nothing else.

Features: F1, F2. Requirements: R1, R2, R3, R4.
"""

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, Timestamped, UUIDPrimaryKey
from app.core.roles import Role
from app.core.tenancy import TenantRoot, TenantScoped


class Organization(TenantRoot, Timestamped, Base):
    __tablename__ = "organization"

    name: Mapped[str] = mapped_column(String(200), nullable=False)


class User(UUIDPrimaryKey, TenantScoped, Timestamped, Base):
    __tablename__ = "user_account"

    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(
        Enum(
            Role,
            name="user_role",
            native_enum=False,
            length=20,
            values_callable=lambda roles: [r.value for r in roles],
            validate_strings=True,
            create_constraint=True,
        ),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
