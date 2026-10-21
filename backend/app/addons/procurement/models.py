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


class Supplier(Base):
    __tablename__ = "suppliers"
    __table_args__ = (UniqueConstraint("organization_id", "supplier_id"),)

    supplier_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("organizations.organization_id"), nullable=False)
    supplier_terms: Mapped[str | None] = mapped_column(String(500))
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    lead_times: Mapped[int | None] = mapped_column(Integer)


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    __table_args__ = (
        UniqueConstraint("organization_id", "po_id"),
        ForeignKeyConstraint(["organization_id", "supplier_id"], ["suppliers.organization_id", "suppliers.supplier_id"]),
        CheckConstraint("status IN ('DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')", name="ck_purchase_order_status"),
    )

    po_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("organizations.organization_id"), nullable=False)
    supplier_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    status: Mapped[str] = mapped_column(String(30), server_default="DRAFT", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"
    __table_args__ = (
        ForeignKeyConstraint(["organization_id", "po_id"], ["purchase_orders.organization_id", "purchase_orders.po_id"]),
        ForeignKeyConstraint(["organization_id", "product_id"], ["products.organization_id", "products.product_id"]),
        CheckConstraint("quantity > 0", name="ck_purchase_order_line_positive_quantity"),
        CheckConstraint("unit_cost >= 0", name="ck_purchase_order_line_nonnegative_cost"),
    )

    line_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("organizations.organization_id"), nullable=False)
    po_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
