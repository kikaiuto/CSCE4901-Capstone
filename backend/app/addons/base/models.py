"""ERP database models for the base addon."""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Organization(Base):
    __tablename__ = "organizations"

    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Role(Base):
    __tablename__ = "roles"
    __table_args__ = (
        UniqueConstraint("organization_id", "role_id"),
        UniqueConstraint("organization_id", "name"),
    )

    role_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("organizations.organization_id"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id"),
        UniqueConstraint("organization_id", "email"),
        ForeignKeyConstraint(
            ["organization_id", "role_id"],
            ["roles.organization_id", "roles.role_id"],
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("organizations.organization_id"), nullable=False)
    role_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
