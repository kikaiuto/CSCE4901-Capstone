"""S-06 supplier, purchase order, and goods receipt endpoints.

Features: F8, F9. Requirements: R16, R17.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.procurement import service
from app.addons.procurement.models import Supplier
from app.addons.procurement.permissions import MANAGE_PROCUREMENT, READ_PROCUREMENT
from app.addons.procurement.schemas import (
    AverageCostOut,
    JournalLineOut,
    PurchaseOrderIn,
    PurchaseOrderLineOut,
    PurchaseOrderOut,
    ReceiptIn,
    ReceiptPreviewOut,
    SupplierIn,
    SupplierOut,
)
from app.core.contracts import bind
from app.core.contracts.procurement import (
    ProcurementContract,
    PurchaseOrder,
    ReceiptQuantity,
)
from app.core.tenancy import TenantContext, get_tenant_session

bind(ProcurementContract, service.ProcurementService)

router = APIRouter()


def procurement(
    session: Annotated[AsyncSession, Depends(get_tenant_session, scope="function")],
) -> service.ProcurementService:
    return service.ProcurementService(session)


Procurement = Annotated[service.ProcurementService, Depends(procurement)]


def _supplier_out(s: Supplier) -> SupplierOut:
    return SupplierOut(
        supplier_id=s.supplier_id,
        name=s.name,
        supplier_terms=s.supplier_terms,
        lead_time_days=s.lead_times,
    )


def _po_out(po: PurchaseOrder) -> PurchaseOrderOut:
    return PurchaseOrderOut(
        po_id=po.po_id,
        number=service.po_number(po.po_id),
        supplier_id=po.supplier_id,
        status=po.status,
        created_at=po.created_at,
        lines=[
            PurchaseOrderLineOut(
                line_id=x.line_id,
                product_id=x.product_id,
                quantity=x.quantity,
                quantity_received=x.quantity_received,
                unit_cost=x.unit_cost,
                line_total=service.line_total(x.quantity, x.unit_cost),
            )
            for x in po.lines
        ],
        total=po.total,
    )


@router.get("/suppliers", response_model=list[SupplierOut])
async def list_suppliers_route(
    ctx: Annotated[TenantContext, Depends(READ_PROCUREMENT)], svc: Procurement
) -> list[SupplierOut]:
    return [_supplier_out(s) for s in await svc.list_suppliers(ctx)]


@router.post("/suppliers", response_model=SupplierOut, status_code=201)
async def create_supplier_route(
    body: SupplierIn, ctx: Annotated[TenantContext, Depends(MANAGE_PROCUREMENT)], svc: Procurement
) -> SupplierOut:
    supplier = await svc.create_supplier(ctx, body.name, body.supplier_terms, body.lead_time_days)
    return _supplier_out(supplier)


@router.get("/purchase-orders", response_model=list[PurchaseOrderOut])
async def list_purchase_orders_route(
    ctx: Annotated[TenantContext, Depends(READ_PROCUREMENT)], svc: Procurement
) -> list[PurchaseOrderOut]:
    return [_po_out(po) for po in await svc.list_purchase_orders(ctx)]


@router.post("/purchase-orders", response_model=PurchaseOrderOut, status_code=201)
async def create_purchase_order_route(
    body: PurchaseOrderIn,
    ctx: Annotated[TenantContext, Depends(MANAGE_PROCUREMENT)],
    svc: Procurement,
) -> PurchaseOrderOut:
    lines = [service.NewLine(x.product_id, x.quantity, x.unit_cost) for x in body.lines]
    return _po_out(await svc.create_purchase_order(ctx, body.supplier_id, lines))


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderOut)
async def get_purchase_order_route(
    po_id: UUID, ctx: Annotated[TenantContext, Depends(READ_PROCUREMENT)], svc: Procurement
) -> PurchaseOrderOut:
    return _po_out(await svc.get_purchase_order(ctx, po_id))


@router.get("/purchase-orders/{po_id}/receive/preview", response_model=ReceiptPreviewOut)
async def preview_receipt_route(
    po_id: UUID, ctx: Annotated[TenantContext, Depends(READ_PROCUREMENT)], svc: Procurement
) -> ReceiptPreviewOut:
    preview = await svc.preview_receipt(ctx, po_id)
    return ReceiptPreviewOut(
        journal_lines=[
            JournalLineOut(account_id=x.account_id, debit=x.debit, credit=x.credit, memo=x.memo)
            for x in preview.journal_lines
        ],
        average_costs=[
            AverageCostOut(
                line_id=x.line_id,
                product_id=x.product_id,
                quantity=x.quantity,
                unit_cost=x.unit_cost,
                average_cost_after=x.average_cost_after,
            )
            for x in preview.average_costs
        ],
    )


@router.post("/purchase-orders/{po_id}/receive", response_model=PurchaseOrderOut)
async def receive_route(
    po_id: UUID,
    body: ReceiptIn,
    ctx: Annotated[TenantContext, Depends(MANAGE_PROCUREMENT)],
    svc: Procurement,
) -> PurchaseOrderOut:
    quantities = [ReceiptQuantity(x.line_id, x.quantity) for x in body.lines]
    return _po_out(await svc.record_goods_receipt(ctx, po_id, quantities))
