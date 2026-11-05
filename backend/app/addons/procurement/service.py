"""Suppliers, purchase orders, and goods receipt (R16, R17).

record_goods_receipt writes RECEIPT ledger rows through InventoryContract.receive
and the Inventory Dr / Accounts Payable Cr entry through
AccountingContract.post_receipt, all in the request's one transaction.

Features: F8, F9. Requirements: R16, R17.
"""

from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.procurement import models, repository
from app.core.contracts import provide
from app.core.contracts.accounting import AccountingContract, JournalLineDraft, ReceiptLine
from app.core.contracts.common import DocumentKind, DocumentRef
from app.core.contracts.inventory import InventoryContract, ReceivedLine
from app.core.contracts.procurement import (
    PO_TRANSITIONS,
    IncomingQuantity,
    PurchaseOrder,
    PurchaseOrderLine,
    PurchaseOrderStatus,
    ReceiptQuantity,
)
from app.core.errors import AppError, Conflict, NotFound
from app.core.tenancy import TenantContext

CENT = Decimal("0.01")


class UnknownReference(AppError):
    """A supplier, product, or PO line id that is not in the caller's organization."""

    status_code = 422
    code = "unknown_reference"

    def __init__(self, field: str) -> None:
        super().__init__(f"{field} not found")
        self.field = field

    def details(self) -> dict[str, Any]:
        return {"field": self.field}


class NotReceivable(Conflict):
    code = "not_receivable"

    def __init__(self, status: PurchaseOrderStatus) -> None:
        super().__init__(f"A purchase order in {status} cannot be received")
        self.status = status

    def details(self) -> dict[str, Any]:
        return {"status": self.status.value}


class OverReceipt(Conflict):
    code = "over_receipt"

    def __init__(self, line: models.PurchaseOrderLine, requested: int) -> None:
        # Copied out now: the row expires when the request rolls back.
        self.line_id = line.line_id
        self.requested = requested
        self.outstanding = line.quantity - line.quantity_received
        super().__init__(
            f"Receiving {requested} would exceed the {self.outstanding} still outstanding"
        )

    def details(self) -> dict[str, Any]:
        return {
            "line_id": str(self.line_id),
            "requested": self.requested,
            "outstanding": self.outstanding,
        }


@dataclass(frozen=True, slots=True)
class NewLine:
    product_id: UUID
    quantity: int
    unit_cost: Decimal


@dataclass(frozen=True, slots=True)
class AverageCostPreview:
    line_id: UUID
    product_id: UUID
    quantity: int
    unit_cost: Decimal
    average_cost_after: Decimal


@dataclass(frozen=True, slots=True)
class ReceiptPreview:
    journal_lines: Sequence[JournalLineDraft]
    average_costs: Sequence[AverageCostPreview]


def po_number(po_id: UUID) -> str:
    # ponytail: purchase_orders has no number column, so the number is derived
    # from the id. Add a sequence column with a migration when S-06 needs PO-0214.
    return f"PO-{po_id.hex[:8].upper()}"


def line_total(quantity: int, unit_cost: Decimal) -> Decimal:
    return (quantity * unit_cost).quantize(CENT, rounding=ROUND_HALF_UP)


def _to_contract(
    po: models.PurchaseOrder, lines: Sequence[models.PurchaseOrderLine]
) -> PurchaseOrder:
    return PurchaseOrder(
        po_id=po.po_id,
        supplier_id=po.supplier_id,
        status=PurchaseOrderStatus(po.status),
        created_at=po.created_at,
        lines=[
            PurchaseOrderLine(x.line_id, x.product_id, x.quantity, x.quantity_received, x.unit_cost)
            for x in lines
        ],
        total=sum((line_total(x.quantity, x.unit_cost) for x in lines), Decimal("0.00")),
    )


class ProcurementService:
    """ProcurementContract, bound in router.py, plus the supplier and PO routes."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_suppliers(self, ctx: TenantContext) -> list[models.Supplier]:
        return await repository.list_suppliers(self.session, ctx.organization_id)

    async def create_supplier(
        self, ctx: TenantContext, name: str, terms: str | None, lead_time_days: int | None
    ) -> models.Supplier:
        supplier = models.Supplier(
            supplier_id=uuid4(),
            organization_id=ctx.organization_id,
            name=name,
            supplier_terms=terms,
            lead_times=lead_time_days,
        )
        await repository.add(self.session, supplier)
        return supplier

    async def list_purchase_orders(self, ctx: TenantContext) -> list[PurchaseOrder]:
        orders = await repository.list_purchase_orders(self.session, ctx.organization_id)
        lines = await repository.lines_for(
            self.session, ctx.organization_id, [po.po_id for po in orders]
        )
        by_po: dict[UUID, list[models.PurchaseOrderLine]] = defaultdict(list)
        for line in lines:
            by_po[line.po_id].append(line)
        return [_to_contract(po, by_po[po.po_id]) for po in orders]

    async def create_purchase_order(
        self, ctx: TenantContext, supplier_id: UUID, lines: Sequence[NewLine]
    ) -> PurchaseOrder:
        """Placed straight into SUBMITTED, ready to receive; the totals are computed here."""
        if await repository.get_supplier(self.session, ctx.organization_id, supplier_id) is None:
            raise UnknownReference("supplier_id")
        products = {x.product_id for x in lines}
        stock = await provide(InventoryContract)(self.session).get_stock(ctx, products)
        for i, x in enumerate(lines):
            if x.product_id not in stock:
                raise UnknownReference(f"lines[{i}].product_id")

        po = models.PurchaseOrder(
            po_id=uuid4(),
            organization_id=ctx.organization_id,
            supplier_id=supplier_id,
            status=PurchaseOrderStatus.SUBMITTED.value,
        )
        await repository.add(
            self.session,
            po,
            *(
                models.PurchaseOrderLine(
                    line_id=uuid4(),
                    organization_id=ctx.organization_id,
                    po_id=po.po_id,
                    product_id=x.product_id,
                    quantity=x.quantity,
                    unit_cost=x.unit_cost,
                    quantity_received=0,
                )
                for x in lines
            ),
        )
        return await self.get_purchase_order(ctx, po.po_id)

    async def get_purchase_order(self, ctx: TenantContext, po_id: UUID) -> PurchaseOrder:
        po, lines = await self._load(ctx, po_id)
        return _to_contract(po, lines)

    async def incoming_for_products(
        self, ctx: TenantContext, product_ids: Sequence[UUID]
    ) -> dict[UUID, Sequence[IncomingQuantity]]:
        lines = await repository.open_lines_for_products(
            self.session, ctx.organization_id, product_ids
        )
        incoming: dict[UUID, list[IncomingQuantity]] = defaultdict(list)
        for x in lines:
            incoming[x.product_id].append(
                IncomingQuantity(x.po_id, x.quantity - x.quantity_received)
            )
        return dict(incoming)

    async def preview_receipt(self, ctx: TenantContext, po_id: UUID) -> ReceiptPreview:
        """What receiving everything still outstanding would post (S-06 action bar)."""
        po, lines = await self._load(ctx, po_id)
        _check_receivable(po)
        outstanding = [
            (x, x.quantity - x.quantity_received) for x in lines if x.quantity > x.quantity_received
        ]
        accounting = provide(AccountingContract)(self.session)
        inventory = provide(InventoryContract)(self.session)
        journal = await accounting.preview_receipt(
            ctx, [ReceiptLine(x.product_id, qty, x.unit_cost) for x, qty in outstanding]
        )
        averages = [
            AverageCostPreview(
                x.line_id,
                x.product_id,
                qty,
                x.unit_cost,
                await inventory.preview_average_cost(ctx, x.product_id, qty, x.unit_cost),
            )
            for x, qty in outstanding
        ]
        return ReceiptPreview(journal, averages)

    async def record_goods_receipt(
        self, ctx: TenantContext, po_id: UUID, quantities: Sequence[ReceiptQuantity]
    ) -> PurchaseOrder:
        po, lines = await self._load(ctx, po_id, for_update=True)
        _check_receivable(po)

        by_id = {x.line_id: x for x in lines}
        requested: dict[UUID, int] = defaultdict(int)
        for i, q in enumerate(quantities):
            if q.line_id not in by_id:
                raise UnknownReference(f"lines[{i}].line_id")
            requested[q.line_id] += q.quantity
        if not requested:
            raise UnknownReference("lines")
        for line_id, qty in requested.items():
            line = by_id[line_id]
            if qty <= 0 or line.quantity_received + qty > line.quantity:
                raise OverReceipt(line, qty)

        for line_id, qty in requested.items():
            by_id[line_id].quantity_received += qty
        status = (
            PurchaseOrderStatus.RECEIVED
            if all(x.quantity_received == x.quantity for x in lines)
            else PurchaseOrderStatus.PARTIALLY_RECEIVED
        )
        current = PurchaseOrderStatus(po.status)
        if status != current and status not in PO_TRANSITIONS[current]:
            raise NotReceivable(current)
        po.status = status.value

        document = DocumentRef(DocumentKind.PURCHASE_ORDER, po.po_id, po_number(po.po_id))
        received = [(by_id[line_id], qty) for line_id, qty in requested.items()]
        await provide(InventoryContract)(self.session).receive(
            ctx, document, [ReceivedLine(x.product_id, qty, x.unit_cost) for x, qty in received]
        )
        await provide(AccountingContract)(self.session).post_receipt(
            ctx, document, [ReceiptLine(x.product_id, qty, x.unit_cost) for x, qty in received]
        )
        await self.session.flush()
        return _to_contract(po, lines)

    async def _load(
        self, ctx: TenantContext, po_id: UUID, *, for_update: bool = False
    ) -> tuple[models.PurchaseOrder, list[models.PurchaseOrderLine]]:
        po = await repository.get_purchase_order(
            self.session, ctx.organization_id, po_id, for_update=for_update
        )
        if po is None:
            raise NotFound("Purchase order not found")
        return po, await repository.lines_for(self.session, ctx.organization_id, [po_id])


def _check_receivable(po: models.PurchaseOrder) -> None:
    status = PurchaseOrderStatus(po.status)
    if status not in repository.OPEN:
        raise NotReceivable(status)
