import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.core.tenancy import TenantScoped


class Customer(TenantScoped, Base):
    __tablename__ = "customers"
    __table_args__ = (UniqueConstraint("organization_id", "customer_id"),)

    customer_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.organization_id"), nullable=False, index=True
    )
    contact_details: Mapped[str | None] = mapped_column(String(500))
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    credit_status: Mapped[str] = mapped_column(String(50), server_default="GOOD", nullable=False)


class SalesOrder(TenantScoped, Base):
    __tablename__ = "sales_orders"
    __table_args__ = (
        UniqueConstraint("organization_id", "order_id"),
        ForeignKeyConstraint(
            ["organization_id", "customer_id"],
            ["customers.organization_id", "customers.customer_id"],
        ),
        CheckConstraint(
            "status IN ('DRAFT', 'CONFIRMED', 'FULFILLED', 'CANCELLED')",
            name="ck_sales_order_status",
        ),
        CheckConstraint("order_total >= 0", name="ck_sales_order_total"),
    )

    order_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.organization_id"), nullable=False, index=True
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    status: Mapped[str] = mapped_column(String(20), server_default="DRAFT", nullable=False)
    order_total: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), nullable=False, default=Decimal("0")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SalesOrderLine(TenantScoped, Base):
    __tablename__ = "sales_order_lines"
    __table_args__ = (
        ForeignKeyConstraint(
            ["organization_id", "order_id"],
            ["sales_orders.organization_id", "sales_orders.order_id"],
        ),
        ForeignKeyConstraint(
            ["organization_id", "product_id"], ["products.organization_id", "products.product_id"]
        ),
        CheckConstraint("quantity > 0", name="ck_sales_order_line_positive_quantity"),
        CheckConstraint("line_total >= 0", name="ck_sales_order_line_nonnegative_total"),
    )

    line_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.organization_id"), nullable=False, index=True
    )
    order_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
