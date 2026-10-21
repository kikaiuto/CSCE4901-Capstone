"""Idempotent, local-only foundation seed data for Sector 7 ERP.

Run from the backend container:
    uv run python -m scripts.seed

This seeds reference/business-master data, NOT users, fulfilled sales,
posted journals, or inventory movements. Those need authenticated and
transaction-safe business services before reliable historical seeding.
"""

import asyncio
import os
import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as postgres_insert
from sqlalchemy.engine import make_url

from app.core.config import get_settings
from app.core.db import Base, get_engine
from app.core.modules.loading import import_models

NAMESPACE = uuid.uuid5(uuid.NAMESPACE_URL, "https://sector7.example/demo-seed/v1")
ROLES = ("Owner", "Admin", "Sales", "Warehouse", "Accounting")
ACCOUNTS = (
    ("1000", "Cash", "Asset"),
    ("1100", "Accounts Receivable", "Asset"),
    ("1200", "Inventory Asset", "Asset"),
    ("2000", "Accounts Payable", "Liability"),
    ("3000", "Owner Equity", "Equity"),
    ("4000", "Sales Revenue", "Revenue"),
    ("5000", "Cost of Goods Sold", "Expense"),
    ("6000", "Operating Expenses", "Expense"),
)
PRODUCTS = (
    ("LAP-01", "Business Laptop", "Laptops", "550.0000", "899.0000"),
    ("LAP-02", "Student Laptop", "Laptops", "390.0000", "649.0000"),
    ("LAP-03", "Lightweight Laptop", "Laptops", "620.0000", "999.0000"),
    ("LAP-04", "Workstation Laptop", "Laptops", "1100.0000", "1599.0000"),
    ("ACC-01", "Wireless Mouse", "Accessories", "12.0000", "29.0000"),
    ("ACC-02", "USB-C Dock", "Accessories", "65.0000", "119.0000"),
    ("ACC-03", "Mechanical Keyboard", "Accessories", "42.0000", "89.0000"),
    ("ACC-04", "Laptop Sleeve", "Accessories", "9.0000", "24.0000"),
    ("ACC-05", "1080p Webcam", "Accessories", "28.0000", "59.0000"),
    ("ACC-06", "External SSD", "Accessories", "52.0000", "99.0000"),
    ("ACC-07", "USB-C Cable", "Accessories", "5.0000", "15.0000"),
    ("ACC-08", "Noise-Canceling Headset", "Accessories", "74.0000", "149.0000"),
)
ORGANIZATIONS = ("Northstar Electronics Demo", "Cedar Retail Demo")


def demo_uuid(*parts: str) -> uuid.UUID:
    return uuid.uuid5(NAMESPACE, "/".join(parts))


async def insert_if_missing(connection, name: str, rows: list[dict]) -> None:
    table = Base.metadata.tables[name]
    await connection.execute(postgres_insert(table).values(rows).on_conflict_do_nothing())


def validate_local_database() -> None:
    settings = get_settings()
    url = make_url(settings.database_url)
    env = os.environ.get("ENVIRONMENT", "local").lower()  

    if (
        env != "local"
        or url.database != "sector7"
        or url.host not in {"postgres", "localhost", "127.0.0.1"}
        or not url.drivername.startswith("postgresql+")
    ):
        raise RuntimeError(
            "Refusing to seed: expected local PostgreSQL 'sector7' database. "
            "Never run this demo seeder against staging, production, or sector7_test."
        )


async def main() -> None:
    validate_local_database()
    import_models()

    required = {
        "organizations", "roles", "chart_of_accounts", "customers",
        "suppliers", "product_categories", "products",
    }
    missing = required - set(Base.metadata.tables)
    if missing:
        raise RuntimeError(f"Model registration is missing: {sorted(missing)}")

    columns = {c.name for c in Base.metadata.tables["chart_of_accounts"].columns}
    if "account_name" not in columns:
        raise RuntimeError(
            "Your chart_of_accounts model must have 'account_name' to match "
            "the applied eb867def2d3c migration. Check accounting/models.py."
        )

    engine = get_engine()
    async with engine.begin() as conn:
        for org_name in ORGANIZATIONS:
            org_id = demo_uuid("organization", org_name)
            await insert_if_missing(conn, "organizations", [
                {"organization_id": org_id, "name": org_name}
            ])

            await insert_if_missing(conn, "roles", [
                {
                    "role_id": demo_uuid(org_name, "role", role),
                    "organization_id": org_id,
                    "name": role,
                }
                for role in ROLES
            ])

            await insert_if_missing(conn, "chart_of_accounts", [
                {
                    "account_id": demo_uuid(org_name, "account", code),
                    "organization_id": org_id,
                    "account_code": code,
                    "account_name": account_name,
                    "account_type": account_type,
                }
                for code, account_name, account_type in ACCOUNTS
            ])

            await insert_if_missing(conn, "product_categories", [
                {
                    "category_id": demo_uuid(org_name, "category", category),
                    "organization_id": org_id,
                    "name": category,
                    "hierarchy_level": 0,
                }
                for category in ("Laptops", "Accessories")
            ])

            await insert_if_missing(conn, "customers", [
                {
                    "customer_id": demo_uuid(org_name, "customer", str(number)),
                    "organization_id": org_id,
                    "name": f"Demo Customer {number}",
                    "contact_details": f"customer{number}@example.test",
                    "credit_status": "GOOD",
                }
                for number in range(1, 11)
            ])

            await insert_if_missing(conn, "suppliers", [
                {
                    "supplier_id": demo_uuid(org_name, "supplier", str(number)),
                    "organization_id": org_id,
                    "name": f"Demo Supplier {number}",
                    "supplier_terms": "Net 30",
                    "lead_times": 7 + number,
                }
                for number in range(1, 4)
            ])

            await insert_if_missing(conn, "products", [
                {
                    "product_id": demo_uuid(org_name, "product", sku),
                    "organization_id": org_id,
                    "category_id": demo_uuid(org_name, "category", category),
                    "asset_account_id": demo_uuid(org_name, "account", "1200"),
                    "revenue_account_id": demo_uuid(org_name, "account", "4000"),
                    "name": product_name,
                    "sku": sku,
                    "unit_cost": Decimal(cost),
                    "average_cost": Decimal(cost),
                    "unit_price": Decimal(price),
                    "safety_stock_threshold": 5,
                }
                for sku, product_name, category, cost, price in PRODUCTS
            ])

        print("Demo foundation seeded (or already present):")
        for name in (
            "organizations", "roles", "chart_of_accounts", "product_categories",
            "customers", "suppliers", "products",
        ):
            table = Base.metadata.tables[name]
            count = await conn.scalar(select(func.count()).select_from(table))
            print(f"  {name}: {count} total rows")

    await engine.dispose()
    print("No users, journal postings, inventory movements, or sales history were created.")


if __name__ == "__main__":
    asyncio.run(main())
