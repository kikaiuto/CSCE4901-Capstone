"""Customer and sales order endpoints (S-03, S-04, S-11, S-12).

Features: F3, F6, F7. Requirements: R5, R6, R13, R14, R15.
"""

from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.sales import service
from app.addons.sales.models import Customer
from app.addons.sales.permissions import READ_SALES, WRITE_SALES
from app.addons.sales.schemas import CustomerIn, CustomerResponse, OrderIn, OrderResponse
from app.core.contracts import bind, provide
from app.core.contracts.sales import OrderDraft, OrderLineDraft, OrderStatus, SalesContract
from app.core.tenancy import TenantContext, get_tenant_session

bind(SalesContract, service.SalesService)

router = APIRouter()

Session = Annotated[AsyncSession, Depends(get_tenant_session, scope="function")]
Sales = Annotated[SalesContract, Depends(provide(SalesContract))]
Reader = Annotated[TenantContext, Depends(READ_SALES)]
Writer = Annotated[TenantContext, Depends(WRITE_SALES)]


def _customer(c: Customer) -> CustomerResponse:
    return CustomerResponse(
        customer_id=c.customer_id,
        name=c.name,
        contact_details=c.contact_details,
        credit_status=c.credit_status,
    )


@router.get("/customers", response_model=list[CustomerResponse])
async def list_customers_route(ctx: Reader, session: Session) -> list[CustomerResponse]:
    return [_customer(c) for c in await service.list_customers(session, ctx)]


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer_route(customer_id: UUID, ctx: Reader, session: Session) -> CustomerResponse:
    return _customer(await service.get_customer(session, ctx, customer_id))


@router.post("/customers", response_model=CustomerResponse, status_code=201)
async def create_customer_route(
    body: CustomerIn, ctx: Writer, session: Session
) -> CustomerResponse:
    return _customer(await service.create_customer(session, ctx, body))


@router.get("/orders", response_model=list[OrderResponse])
async def list_orders_route(
    ctx: Reader, sales: Sales, status: OrderStatus | None = None
) -> list[OrderResponse]:
    return [OrderResponse.of(o) for o in await sales.list_orders(ctx, status)]


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order_route(order_id: UUID, ctx: Reader, sales: Sales) -> OrderResponse:
    return OrderResponse.of(await sales.get_order(ctx, order_id))


@router.post("/orders", response_model=OrderResponse, status_code=201)
async def create_order_route(body: OrderIn, ctx: Writer, sales: Sales) -> OrderResponse:
    draft = OrderDraft(
        customer_id=body.customer_id,
        # create_order prices each line from the catalog; no client price exists to pass.
        lines=[OrderLineDraft(x.product_id, x.quantity, Decimal("0")) for x in body.lines],
    )
    return OrderResponse.of(await sales.create_order(ctx, draft))


async def _move(sales: SalesContract, ctx: TenantContext, order_id: UUID, to: OrderStatus):
    return OrderResponse.of(await sales.transition_order_status(ctx, order_id, to))


@router.post("/orders/{order_id}/confirm", response_model=OrderResponse)
async def confirm_order_route(order_id: UUID, ctx: Writer, sales: Sales) -> OrderResponse:
    return await _move(sales, ctx, order_id, OrderStatus.CONFIRMED)


@router.post("/orders/{order_id}/fulfil", response_model=OrderResponse)
async def fulfil_order_route(order_id: UUID, ctx: Writer, sales: Sales) -> OrderResponse:
    return await _move(sales, ctx, order_id, OrderStatus.FULFILLED)


@router.post("/orders/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order_route(order_id: UUID, ctx: Writer, sales: Sales) -> OrderResponse:
    return await _move(sales, ctx, order_id, OrderStatus.CANCELLED)
