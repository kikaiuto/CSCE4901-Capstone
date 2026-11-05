"""Pydantic V2 request and response schemas for the sales addon.

Order requests carry products and quantities only: prices, line totals, tax and
the order total are computed by the service and never read from the client (R13).

Features: F3, F6, F7. Requirements: R5, R6, R13, R14, R15.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.contracts.sales import Order, OrderStatus


class CustomerIn(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    contact_details: str | None = Field(default=None, max_length=500)


class CustomerResponse(BaseModel):
    customer_id: UUID
    name: str
    contact_details: str | None
    credit_status: str


class OrderLineIn(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0, le=1_000_000)


class OrderIn(BaseModel):
    customer_id: UUID
    lines: list[OrderLineIn] = Field(min_length=1, max_length=500)


class OrderLineOut(BaseModel):
    line_id: UUID
    product_id: UUID
    quantity: int
    line_total: Decimal


class OrderResponse(BaseModel):
    order_id: UUID
    customer_id: UUID
    status: OrderStatus
    created_at: datetime
    lines: list[OrderLineOut]
    subtotal: Decimal
    tax: Decimal
    order_total: Decimal

    @classmethod
    def of(cls, order: Order) -> "OrderResponse":
        subtotal = sum((line.line_total for line in order.lines), Decimal("0.00"))
        return cls(
            order_id=order.order_id,
            customer_id=order.customer_id,
            status=order.status,
            created_at=order.created_at,
            lines=[
                OrderLineOut(
                    line_id=x.line_id,
                    product_id=x.product_id,
                    quantity=x.quantity,
                    line_total=x.line_total,
                )
                for x in order.lines
            ],
            subtotal=subtotal,
            # sales_orders stores only the total; tax is what the service added on top.
            tax=order.order_total - subtotal,
            order_total=order.order_total,
        )
