
"""Business logic for inventory operations."""

from collections import Counter
from collections.abc import Collection, Mapping, Sequence
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.inventory import repository
from app.addons.inventory.models import InventoryLedger, Product, StockReservation
from app.addons.inventory.schemas import ProductCreateRequest
from app.core.contracts.accounting import AccountType
from app.core.contracts.common import DocumentRef
from app.core.contracts.inventory import (
    AdjustmentLine,
    InsufficientStock,
    LedgerRow,
    ProductAccounts,
    ReceivedLine,
    Shortage,
    StockLevel,
    StockLine,
)
from app.core.errors import AppError, Conflict, NotFound
from app.core.tenancy import TenantContext

UNIT_COST = Decimal("0.0001")


def _is_duplicate_sku_error(exc: IntegrityError) -> bool:
    """Identify a tenant-scoped product SKU unique-constraint violation."""

    original_error = exc.orig
    expected_constraint = "products_organization_id_sku_key"

    # PostgreSQL unique-constraint violation: SQLSTATE 23505.
    sqlstate = getattr(original_error, "sqlstate", None)

    if sqlstate is None:
        sqlstate = getattr(original_error, "pgcode", None)

    if sqlstate == "23505":
        # Support drivers that expose structured diagnostics.
        diagnostic = getattr(original_error, "diag", None)
        constraint_name = getattr(
            diagnostic,
            "constraint_name",
            None,
        )

        if constraint_name == expected_constraint:
            return True

        # SQLAlchemy's asyncpg wrapper may retain the original
        # PostgreSQL exception as its cause.
        cause = getattr(original_error, "__cause__", None)

        if cause is not None:
            cause_diagnostic = getattr(cause, "diag", None)

            cause_constraint = getattr(
                cause,
                "constraint_name",
                None,
            )

            if cause_constraint is None:
                cause_constraint = getattr(
                    cause_diagnostic,
                    "constraint_name",
                    None,
                )

            if cause_constraint == expected_constraint:
                return True

        # asyncpg/SQLAlchemy can include the constraint name
        # in the exception message instead of a diag attribute.
        if expected_constraint in str(original_error):
            return True

        if (
            cause is not None
            and expected_constraint in str(cause)
        ):
            return True

        # Do not classify unrelated PostgreSQL constraints
        # as duplicate product SKUs.
        return False

    # SQLite unique-constraint violation used in local tests.
    sqlite_error_name = getattr(
        original_error,
        "sqlite_errorname",
        None,
    )

    sqlite_message = str(original_error)

    if (
        sqlite_error_name == "SQLITE_CONSTRAINT_UNIQUE"
        and "products.organization_id" in sqlite_message
        and "products.sku" in sqlite_message
    ):
        return True

    return False


async def list_products(
    session: AsyncSession,
    organization_id: UUID,
    limit: int = 100,
    offset: int = 0,
) -> list[Product]:
    """Return products belonging to the current organization."""

    return await repository.list_products(
        session=session,
        organization_id=organization_id,
        limit=limit,
        offset=offset,
    )


async def get_product(
    session: AsyncSession,
    organization_id: UUID,
    product_id: UUID,
) -> Product:
    """Retrieve a product belonging to the current organization."""

    product = await repository.get_product(
        session=session,
        organization_id=organization_id,
        product_id=product_id,
    )

    if product is None:
        raise NotFound("Product not found")

    return product


async def create_product(
    session: AsyncSession,
    organization_id: UUID,
    payload: ProductCreateRequest,
) -> Product:
    """Validate and create a product for the current organization."""

    # Validate that the category belongs to the current organization.
    category = await repository.get_category(
        session=session,
        organization_id=organization_id,
        category_id=payload.category_id,
    )

    if category is None:
        raise AppError("Invalid product category")

    # Validate the inventory asset account.
    asset_account = await repository.get_account(
        session=session,
        organization_id=organization_id,
        account_id=payload.asset_account_id,
    )

    if (
        asset_account is None
        or str(asset_account.account_type).lower()
        != AccountType.ASSET.value
    ):
        raise AppError("Invalid inventory asset account")

    # Validate the sales revenue account.
    revenue_account = await repository.get_account(
        session=session,
        organization_id=organization_id,
        account_id=payload.revenue_account_id,
    )

    if (
        revenue_account is None
        or str(revenue_account.account_type).lower()
        != AccountType.REVENUE.value
    ):
        raise AppError("Invalid sales revenue account")

    # Reject duplicate SKUs within the current organization.
    if await repository.sku_exists(
        session=session,
        organization_id=organization_id,
        sku=payload.sku,
    ):
        raise Conflict(
            "A product with this SKU already exists"
        )

    # Construct the new product.
    product = Product(
        organization_id=organization_id,
        category_id=payload.category_id,
        asset_account_id=payload.asset_account_id,
        revenue_account_id=payload.revenue_account_id,
        name=payload.name,
        sku=payload.sku,
        unit_cost=payload.unit_cost,
        average_cost=payload.unit_cost,
        unit_price=payload.unit_price,
        safety_stock_threshold=payload.safety_stock_threshold,
    )

    try:
        # Use a savepoint so an insert constraint failure
        # does not invalidate the outer transaction.
        async with session.begin_nested():
            await repository.create_product(
                session=session,
                product=product,
            )

    except IntegrityError as exc:
        # Convert only duplicate-SKU violations into HTTP 409.
        if _is_duplicate_sku_error(exc):
            raise Conflict(
                "A product with this SKU already exists"
            ) from exc

        # Preserve unrelated database integrity errors.
        raise

    return product


def moving_average_cost(
    on_hand: int, current_cost: Decimal, received_qty: int, unit_cost: Decimal
) -> Decimal:
    """R17: ((on_hand * current) + (received * unit)) / (on_hand + received), rounded
    ROUND_HALF_UP to four places, the NUMERIC(12, 4) the column stores."""

    total = on_hand + received_qty
    if total <= 0:
        return unit_cost.quantize(UNIT_COST, rounding=ROUND_HALF_UP)
    value = on_hand * current_cost + received_qty * unit_cost
    return (value / total).quantize(UNIT_COST, rounding=ROUND_HALF_UP)


def _ledger_row(row: InventoryLedger) -> LedgerRow:
    return LedgerRow(
        ledger_id=row.ledger_id,
        product_id=row.product_id,
        change_quantity=row.change_quantity,
        resulting_on_hand=row.resulting_on_hand,
        unit_cost=row.unit_cost,
        reference_document=row.reference_document,
        user_id=row.user_id,
        created_at=row.created_at,
    )


def _shortages(
    wanted: Mapping[UUID, int], on_hand: Mapping[UUID, int], committed: Mapping[UUID, int]
) -> list[Shortage]:
    shortages = []
    for product_id in sorted(wanted):
        available = on_hand.get(product_id, 0) - committed.get(product_id, 0)
        if wanted[product_id] > available:
            shortages.append(Shortage(product_id, wanted[product_id], available))
    return shortages


class InventoryService:
    """InventoryContract. Ledger and reservation rows are only ever appended: on
    hand is the sum of a product's ledger rows, committed the sum of its
    reservation rows. Every writer locks its product rows first, flushes, and
    leaves the commit to the request."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _lock(
        self, ctx: TenantContext, product_ids: Collection[UUID]
    ) -> dict[UUID, Product]:
        products = await repository.get_products(
            self.session, ctx.organization_id, product_ids, lock=True
        )
        if len(products) != len(set(product_ids)):
            raise NotFound("Product not found")
        return products

    async def _levels(
        self, ctx: TenantContext, product_ids: Collection[UUID]
    ) -> tuple[dict[UUID, int], dict[UUID, int]]:
        on_hand = await repository.on_hand_by_product(
            self.session, ctx.organization_id, product_ids
        )
        committed = await repository.committed_by_product(
            self.session, ctx.organization_id, product_ids
        )
        return on_hand, committed

    async def _outstanding(self, ctx: TenantContext, document: DocumentRef) -> dict[UUID, int]:
        reserved = await repository.reserved_for_document(
            self.session, ctx.organization_id, document.kind.value, document.id
        )
        if reserved is None:
            raise NotFound(f"{document.number} has no reservation")
        return {product_id: qty for product_id, qty in reserved.items() if qty}

    def _new_ledger(
        self,
        ctx: TenantContext,
        document: DocumentRef,
        product: Product,
        change: int,
        resulting: int,
        reason: str | None = None,
    ) -> InventoryLedger:
        return InventoryLedger(
            organization_id=ctx.organization_id,
            product_id=product.product_id,
            user_id=ctx.user_id,
            change_quantity=change,
            resulting_on_hand=resulting,
            reference_document=document.number,
            unit_cost=product.average_cost,
            reason=reason,
            created_at=datetime.now(UTC),
        )

    def _new_reservation(
        self, ctx: TenantContext, document: DocumentRef, product_id: UUID, change: int
    ) -> StockReservation:
        return StockReservation(
            organization_id=ctx.organization_id,
            product_id=product_id,
            document_kind=document.kind.value,
            document_id=document.id,
            document_number=document.number,
            change_quantity=change,
            user_id=ctx.user_id,
        )

    # Readers

    async def get_stock(
        self, ctx: TenantContext, product_ids: Collection[UUID]
    ) -> Mapping[UUID, StockLevel]:
        products = await repository.get_products(self.session, ctx.organization_id, product_ids)
        on_hand, committed = await self._levels(ctx, products)
        # ponytail: incoming is 0 until inventory can read ProcurementReader; procurement
        # depends on inventory, so importing it here would be a cycle.
        return {
            product_id: StockLevel(
                product_id=product_id,
                on_hand=on_hand.get(product_id, 0),
                committed=committed.get(product_id, 0),
                available=on_hand.get(product_id, 0) - committed.get(product_id, 0),
                incoming=0,
                moving_average_cost=product.average_cost,
            )
            for product_id, product in products.items()
        }

    async def get_ledger(
        self, ctx: TenantContext, product_id: UUID, limit: int = 50
    ) -> Sequence[LedgerRow]:
        rows = await repository.list_ledger(self.session, ctx.organization_id, product_id, limit)
        return [_ledger_row(row) for row in rows]

    async def get_product_accounts(
        self, ctx: TenantContext, product_ids: Collection[UUID]
    ) -> Mapping[UUID, ProductAccounts]:
        products = await repository.get_products(self.session, ctx.organization_id, product_ids)
        return {
            product_id: ProductAccounts(
                product_id, product.asset_account_id, product.revenue_account_id
            )
            for product_id, product in products.items()
        }

    async def preview_average_cost(
        self, ctx: TenantContext, product_id: UUID, received_qty: int, unit_cost: Decimal
    ) -> Decimal:
        products = await repository.get_products(self.session, ctx.organization_id, [product_id])
        if product_id not in products:
            raise NotFound("Product not found")
        on_hand, _ = await self._levels(ctx, [product_id])
        return moving_average_cost(
            on_hand.get(product_id, 0), products[product_id].average_cost, received_qty, unit_cost
        )

    # Writers

    async def reserve(
        self, ctx: TenantContext, document: DocumentRef, lines: Sequence[StockLine]
    ) -> None:
        requested = Counter[UUID]()
        for line in lines:
            if line.quantity <= 0:
                raise AppError("Reserved quantity must be positive")
            requested[line.product_id] += line.quantity
        if not requested:
            raise AppError("Nothing to reserve")

        await self._lock(ctx, requested)
        existing = await repository.reserved_for_document(
            self.session, ctx.organization_id, document.kind.value, document.id
        )
        if existing and any(existing.values()):
            raise Conflict(f"{document.number} already has a reservation")

        on_hand, committed = await self._levels(ctx, requested)
        shortages = _shortages(requested, on_hand, committed)
        if shortages:
            raise InsufficientStock(shortages)

        await repository.append(
            self.session,
            [
                self._new_reservation(ctx, document, product_id, quantity)
                for product_id, quantity in sorted(requested.items())
            ],
        )

    async def release(self, ctx: TenantContext, document: DocumentRef) -> None:
        outstanding = await self._outstanding(ctx, document)
        if not outstanding:
            return
        await self._lock(ctx, outstanding)
        await repository.append(
            self.session,
            [
                self._new_reservation(ctx, document, product_id, -quantity)
                for product_id, quantity in outstanding.items()
            ],
        )

    async def ship(self, ctx: TenantContext, document: DocumentRef) -> Sequence[LedgerRow]:
        outstanding = await self._outstanding(ctx, document)
        if not outstanding:
            raise Conflict(f"{document.number} has nothing reserved to ship")

        products = await self._lock(ctx, outstanding)
        on_hand, _ = await self._levels(ctx, outstanding)
        ledger = [
            self._new_ledger(
                ctx, document, products[product_id], -quantity, on_hand[product_id] - quantity
            )
            for product_id, quantity in outstanding.items()
        ]
        reservations = [
            self._new_reservation(ctx, document, product_id, -quantity)
            for product_id, quantity in outstanding.items()
        ]
        await repository.append(self.session, [*ledger, *reservations])
        return [_ledger_row(row) for row in ledger]

    async def receive(
        self, ctx: TenantContext, document: DocumentRef, lines: Sequence[ReceivedLine]
    ) -> Sequence[LedgerRow]:
        if not lines:
            raise AppError("Nothing to receive")
        for line in lines:
            if line.quantity <= 0:
                raise AppError("Received quantity must be positive")
            if line.unit_cost < 0:
                raise AppError("Unit cost cannot be negative")

        products = await self._lock(ctx, {line.product_id for line in lines})
        on_hand, _ = await self._levels(ctx, products)
        ledger = []
        # Lines apply in order, so a product on two lines averages twice.
        for line in lines:
            product = products[line.product_id]
            current = on_hand.get(line.product_id, 0)
            product.average_cost = moving_average_cost(
                current, product.average_cost, line.quantity, line.unit_cost
            )
            on_hand[line.product_id] = current + line.quantity
            ledger.append(
                self._new_ledger(ctx, document, product, line.quantity, on_hand[line.product_id])
            )
        await repository.append(self.session, ledger)
        return [_ledger_row(row) for row in ledger]

    async def adjust(
        self,
        ctx: TenantContext,
        document: DocumentRef,
        reason: str,
        lines: Sequence[AdjustmentLine],
    ) -> Sequence[LedgerRow]:
        reason = reason.strip()
        if not reason:
            raise AppError("An adjustment needs a reason")
        changes = Counter[UUID]()
        for line in lines:
            if line.change_quantity == 0:
                raise AppError("Adjustment quantity cannot be zero")
            changes[line.product_id] += line.change_quantity
        if not changes:
            raise AppError("Nothing to adjust")

        products = await self._lock(ctx, changes)
        on_hand, committed = await self._levels(ctx, changes)
        # Shrinkage may not eat into stock already committed to an order.
        removed = {product_id: -change for product_id, change in changes.items() if change < 0}
        shortages = _shortages(removed, on_hand, committed)
        if shortages:
            raise InsufficientStock(shortages)

        ledger = [
            self._new_ledger(
                ctx,
                document,
                products[product_id],
                change,
                on_hand.get(product_id, 0) + change,
                reason,
            )
            for product_id, change in sorted(changes.items())
            if change
        ]
        await repository.append(self.session, ledger)
        return [_ledger_row(row) for row in ledger]
