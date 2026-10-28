
"""Integration tests for tenant-scoped product creation."""

import sqlite3
import uuid
from unittest.mock import Mock

import pytest
from sqlalchemy.exc import IntegrityError

from app.addons.inventory.service import _is_duplicate_sku_error
from app.core.roles import Role

PRODUCTS_URL = "/api/inventory/products"


def product_payload(tenant, **changes):
    """Build a valid product request using tenant-owned references."""
    payload = {
        "name": "Premium Fuel Filter",
        "sku": f"FILTER-{uuid.uuid4().hex[:12]}",
        "category_id": str(tenant.category_id),
        "asset_account_id": str(tenant.asset_id),
        "revenue_account_id": str(tenant.revenue_id),
        "unit_cost": "12.5000",
        "unit_price": "24.9900",
        "safety_stock_threshold": 10,
    }
    return payload | changes


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "role",
    [Role.OWNER, Role.ADMIN, Role.INVENTORY],
)
async def test_authorized_roles_can_create_product(client, tenants, role):
    first, _ = tenants
    payload = product_payload(first)

    response = await client.post(
        PRODUCTS_URL,
        json=payload,
        headers=first.headers(role),
    )

    assert response.status_code == 201, response.text

    data = response.json()
    assert data["name"] == payload["name"]
    assert data["sku"] == payload["sku"]
    assert data["category_id"] == payload["category_id"]
    assert data["safety_stock_threshold"] == 10
    assert uuid.UUID(data["product_id"])


@pytest.mark.asyncio
async def test_created_product_can_be_retrieved(client, tenants):
    first, _ = tenants
    payload = product_payload(first)

    created = await client.post(
        PRODUCTS_URL,
        json=payload,
        headers=first.headers(),
    )

    assert created.status_code == 201, created.text

    product_id = created.json()["product_id"]

    retrieved = await client.get(
        f"{PRODUCTS_URL}/{product_id}",
        headers=first.headers(),
    )

    assert retrieved.status_code == 200, retrieved.text
    assert retrieved.json()["product_id"] == product_id
    assert retrieved.json()["sku"] == payload["sku"]


@pytest.mark.asyncio
async def test_sales_role_cannot_create_product(client, tenants):
    first, _ = tenants

    response = await client.post(
        PRODUCTS_URL,
        json=product_payload(first),
        headers=first.headers(Role.SALES),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_unauthenticated_user_cannot_create_product(client, tenants):
    first, _ = tenants

    response = await client.post(
        PRODUCTS_URL,
        json=product_payload(first),
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_duplicate_sku_is_rejected(client, tenants):
    first, _ = tenants
    payload = product_payload(first, sku="W-01")

    response = await client.post(
        PRODUCTS_URL,
        json=payload,
        headers=first.headers(),
    )

    assert response.status_code == 409
    assert response.json()["error"] == "conflict"


@pytest.mark.asyncio
async def test_cross_tenant_category_is_rejected(client, tenants):
    first, second = tenants

    payload = product_payload(
        first,
        category_id=str(second.category_id),
    )

    response = await client.post(
        PRODUCTS_URL,
        json=payload,
        headers=first.headers(),
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_cross_tenant_asset_account_is_rejected(client, tenants):
    first, second = tenants

    payload = product_payload(
        first,
        asset_account_id=str(second.asset_id),
    )

    response = await client.post(
        PRODUCTS_URL,
        json=payload,
        headers=first.headers(),
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_cross_tenant_revenue_account_is_rejected(client, tenants):
    first, second = tenants

    payload = product_payload(
        first,
        revenue_account_id=str(second.revenue_id),
    )

    response = await client.post(
        PRODUCTS_URL,
        json=payload,
        headers=first.headers(),
    )

    assert response.status_code == 400


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "field,value",
    [
        ("unit_cost", "-1.0000"),
        ("unit_price", "-5.0000"),
        ("safety_stock_threshold", -1),
        ("name", ""),
        ("sku", ""),
    ],
)
async def test_invalid_product_data_is_rejected(
    client,
    tenants,
    field,
    value,
):
    first, _ = tenants

    payload = product_payload(first, **{field: value})

    response = await client.post(
        PRODUCTS_URL,
        json=payload,
        headers=first.headers(),
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_created_product_is_hidden_from_other_tenants(client, tenants):
    first, second = tenants

    created = await client.post(
        PRODUCTS_URL,
        json=product_payload(first),
        headers=first.headers(),
    )

    assert created.status_code == 201, created.text

    product_id = created.json()["product_id"]

    response = await client.get(
        f"{PRODUCTS_URL}/{product_id}",
        headers=second.headers(),
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_same_sku_allowed_for_different_tenants(client, tenants):
    first, second = tenants
    shared_sku = f"SHARED-{uuid.uuid4().hex[:12]}"

    first_response = await client.post(
        PRODUCTS_URL,
        json=product_payload(first, sku=shared_sku),
        headers=first.headers(),
    )

    second_response = await client.post(
        PRODUCTS_URL,
        json=product_payload(second, sku=shared_sku),
        headers=second.headers(),
    )

    assert first_response.status_code == 201, first_response.text
    assert second_response.status_code == 201, second_response.text
    assert (
        first_response.json()["product_id"]
        != second_response.json()["product_id"]
    )


def test_postgresql_duplicate_sku_constraint():
    """Recognize a PostgreSQL duplicate-SKU violation."""
    original_error = Mock()
    original_error.sqlstate = "23505"
    original_error.diag.constraint_name = (
        "products_organization_id_sku_key"
    )

    error = IntegrityError(
        "INSERT INTO products",
        {},
        original_error,
    )

    assert _is_duplicate_sku_error(error) is True


def test_postgresql_unrelated_constraint():
    """Do not classify another PostgreSQL constraint as duplicate SKU."""
    original_error = Mock()
    original_error.sqlstate = "23505"
    original_error.diag.constraint_name = (
        "products_organization_id_product_id_key"
    )

    error = IntegrityError(
        "INSERT INTO products",
        {},
        original_error,
    )

    assert _is_duplicate_sku_error(error) is False


def test_sqlite_duplicate_sku_constraint():
    """Recognize a real SQLite unique-constraint exception."""
    connection = sqlite3.connect(":memory:")

    try:
        connection.execute(
            """
            CREATE TABLE products (
                organization_id TEXT NOT NULL,
                sku TEXT NOT NULL,
                UNIQUE (organization_id, sku)
            )
            """
        )

        connection.execute(
            "INSERT INTO products VALUES (?, ?)",
            ("tenant-1", "SKU-001"),
        )

        with pytest.raises(sqlite3.IntegrityError) as captured:
            connection.execute(
                "INSERT INTO products VALUES (?, ?)",
                ("tenant-1", "SKU-001"),
            )

        error = IntegrityError(
            "INSERT INTO products",
            {},
            captured.value,
        )

        assert _is_duplicate_sku_error(error) is True

    finally:
        connection.close()


def test_sqlite_unrelated_constraint():
    """Do not classify a SQLite foreign-key error as duplicate SKU."""
    connection = sqlite3.connect(":memory:")

    try:
        connection.execute("PRAGMA foreign_keys = ON")

        connection.execute(
            """
            CREATE TABLE categories (
                category_id TEXT PRIMARY KEY
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE products (
                category_id TEXT NOT NULL,
                FOREIGN KEY (category_id)
                    REFERENCES categories(category_id)
            )
            """
        )

        with pytest.raises(sqlite3.IntegrityError) as captured:
            connection.execute(
                "INSERT INTO products VALUES (?)",
                ("missing-category",),
            )

        error = IntegrityError(
            "INSERT INTO products",
            {},
            captured.value,
        )

        assert _is_duplicate_sku_error(error) is False

    finally:
        connection.close()


@pytest.mark.asyncio
async def test_product_name_and_sku_are_trimmed(client, tenants):
    """Remove surrounding whitespace before saving a product."""
    first, _ = tenants
    sku = f"TRIM-{uuid.uuid4().hex[:12]}"

    payload = product_payload(
        first,
        name="  Premium Fuel Filter  ",
        sku=f"  {sku}  ",
    )

    response = await client.post(
        PRODUCTS_URL,
        json=payload,
        headers=first.headers(),
    )

    assert response.status_code == 201, response.text
    assert response.json()["name"] == "Premium Fuel Filter"
    assert response.json()["sku"] == sku


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "field",
    ["name", "sku"],
)
async def test_whitespace_only_product_fields_are_rejected(
    client,
    tenants,
    field,
):
    """Reject names and SKUs that contain only whitespace."""
    first, _ = tenants
    payload = product_payload(first, **{field: "   "})

    response = await client.post(
        PRODUCTS_URL,
        json=payload,
        headers=first.headers(),
    )

    assert response.status_code == 422


def test_asyncpg_duplicate_sku_constraint():
    """Recognize an asyncpg-style wrapped duplicate-SKU error."""

    class AsyncpgUniqueViolation(Exception):
        sqlstate = "23505"

    original_error = AsyncpgUniqueViolation(
        'duplicate key value violates unique constraint '
        '"products_organization_id_sku_key"'
    )

    error = IntegrityError(
        "INSERT INTO products",
        {},
        original_error,
    )

    assert _is_duplicate_sku_error(error) is True


def test_asyncpg_unrelated_unique_constraint():
    """Do not mistake another unique constraint for a duplicate SKU."""

    class AsyncpgUniqueViolation(Exception):
        sqlstate = "23505"

    original_error = AsyncpgUniqueViolation(
        'duplicate key value violates unique constraint '
        '"products_other_unique_key"'
    )

    error = IntegrityError(
        "INSERT INTO products",
        {},
        original_error,
    )

    assert _is_duplicate_sku_error(error) is False


def test_asyncpg_duplicate_sku_constraint_in_cause():
    """Recognize a duplicate-SKU constraint in the wrapped cause."""

    class AsyncpgUniqueViolation(Exception):
        sqlstate = "23505"

    cause = AsyncpgUniqueViolation(
        'duplicate key value violates unique constraint '
        '"products_organization_id_sku_key"'
    )

    original_error = AsyncpgUniqueViolation(
        "PostgreSQL unique violation"
    )
    original_error.__cause__ = cause

    error = IntegrityError(
        "INSERT INTO products",
        {},
        original_error,
    )

    assert _is_duplicate_sku_error(error) is True


def test_asyncpg_unrelated_constraint_in_cause():
    """Reject an unrelated constraint reported by the wrapped cause."""

    class AsyncpgUniqueViolation(Exception):
        sqlstate = "23505"

    cause = AsyncpgUniqueViolation(
        'duplicate key value violates unique constraint '
        '"products_other_unique_key"'
    )

    original_error = AsyncpgUniqueViolation(
        "PostgreSQL unique violation"
    )
    original_error.__cause__ = cause

    error = IntegrityError(
        "INSERT INTO products",
        {},
        original_error,
    )

    assert _is_duplicate_sku_error(error) is False
