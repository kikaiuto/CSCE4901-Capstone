
"""Business logic for inventory operations."""

from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.inventory import repository
from app.addons.inventory.models import Product
from app.addons.inventory.schemas import ProductCreateRequest
from app.core.errors import AppError, Conflict, NotFound


def _is_duplicate_sku_error(exc: IntegrityError) -> bool:
    """Identify a tenant-scoped product SKU unique-constraint violation."""

    original_error = exc.orig

    # PostgreSQL: unique-constraint violation (SQLSTATE 23505).
    sqlstate = getattr(original_error, "sqlstate", None)
    if sqlstate is None:
        sqlstate = getattr(original_error, "pgcode", None)

    diagnostic = getattr(original_error, "diag", None)
    constraint_name = getattr(
        diagnostic,
        "constraint_name",
        None,
    )

    if (
        sqlstate == "23505"
        and constraint_name == "products_organization_id_sku_key"
    ):
        return True

    # SQLite: unique-constraint violation during local testing.
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

    if asset_account is None or asset_account.account_type != "Asset":
        raise AppError("Invalid inventory asset account")

    # Validate the sales revenue account.
    revenue_account = await repository.get_account(
        session=session,
        organization_id=organization_id,
        account_id=payload.revenue_account_id,
    )

    if revenue_account is None or revenue_account.account_type != "Revenue":
        raise AppError("Invalid sales revenue account")

    # Reject duplicate SKUs within the current organization.
    if await repository.sku_exists(
        session=session,
        organization_id=organization_id,
        sku=payload.sku,
    ):
        raise Conflict("A product with this SKU already exists")

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
        # A savepoint allows database constraint errors to be
        # handled without invalidating the outer transaction.
        async with session.begin_nested():
            await repository.create_product(
                session=session,
                product=product,
            )

    except IntegrityError as exc:
        # Return HTTP 409 only for duplicate product SKUs.
        if _is_duplicate_sku_error(exc):
            raise Conflict(
                "A product with this SKU already exists"
            ) from exc

        # Preserve unrelated database integrity errors.
        raise

    return product
