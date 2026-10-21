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


class ProductCategory(Base):
    __tablename__ = "product_categories"
    __table_args__ = (
        UniqueConstraint("organization_id", "category_id"),
        UniqueConstraint("organization_id", "name"),
        CheckConstraint("hierarchy_level >= 0", name="ck_category_hierarchy_level"),
    )

    category_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("organizations.organization_id"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    hierarchy_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("organization_id", "product_id"),
        UniqueConstraint("organization_id", "sku"),
        ForeignKeyConstraint(["organization_id", "category_id"], ["product_categories.organization_id", "product_categories.category_id"]),
        ForeignKeyConstraint(["organization_id", "asset_account_id"], ["chart_of_accounts.organization_id", "chart_of_accounts.account_id"]),
        ForeignKeyConstraint(["organization_id", "revenue_account_id"], ["chart_of_accounts.organization_id", "chart_of_accounts.account_id"]),
        CheckConstraint("unit_cost >= 0 AND unit_price >= 0 AND average_cost >= 0", name="ck_product_nonnegative_prices"),
        CheckConstraint("safety_stock_threshold >= 0", name="ck_nonnegative_safety_stock"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("organizations.organization_id"), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    asset_account_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    revenue_account_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    sku: Mapped[str] = mapped_column(String(80), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False, default=Decimal("0"))
    average_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False, default=Decimal("0"))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    safety_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class InventoryLedger(Base):
    __tablename__ = "inventory_ledger"
    __table_args__ = (
        ForeignKeyConstraint(["organization_id", "product_id"], ["products.organization_id", "products.product_id"]),
        ForeignKeyConstraint(["organization_id", "user_id"], ["users.organization_id", "users.user_id"]),
        Index("ix_inventory_ledger_product_time", "organization_id", "product_id", "created_at"),
        CheckConstraint("resulting_on_hand >= 0", name="ck_inventory_on_hand_nonnegative"),
    )

    ledger_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("organizations.organization_id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    change_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    resulting_on_hand: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_document: Mapped[str | None] = mapped_column(String(150))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
