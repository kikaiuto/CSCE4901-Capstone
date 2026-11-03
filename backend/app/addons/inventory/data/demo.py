"""Demo rows for the inventory addon, loaded into the seed tenants.

Features: F4, F5, F6, F9, F19. Requirements: R7, R8, R9, R10, R11, R12, R31.
Registered as the "seeds" entry of this addon's manifest (FND-06).

Categories and products. A product's asset and revenue accounts are the
accounting seed's 1200 and 4000 rows, reached by the same deterministic id the
chart of accounts uses, since accounting seeds before inventory in load order.
Stock history waits for the movement service.
"""

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.addons.inventory.models import Product, ProductCategory
from app.core.seeding import DemoTenant, add_missing

CATEGORIES = ("Laptops", "Accessories")
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
INVENTORY_ASSET_ACCOUNT = "1200"
SALES_REVENUE_ACCOUNT = "4000"


async def seed(session: AsyncSession, tenant: DemoTenant) -> int:
    added = await add_missing(
        session,
        ProductCategory,
        [
            {
                "category_id": tenant.id_for("category", category),
                "organization_id": tenant.organization_id,
                "name": category,
                "hierarchy_level": 0,
            }
            for category in CATEGORIES
        ],
    )
    added += await add_missing(
        session,
        Product,
        [
            {
                "product_id": tenant.id_for("product", sku),
                "organization_id": tenant.organization_id,
                "category_id": tenant.id_for("category", category),
                "asset_account_id": tenant.id_for("account", INVENTORY_ASSET_ACCOUNT),
                "revenue_account_id": tenant.id_for("account", SALES_REVENUE_ACCOUNT),
                "name": name,
                "sku": sku,
                "unit_cost": Decimal(cost),
                "average_cost": Decimal(cost),
                "unit_price": Decimal(price),
                "safety_stock_threshold": 5,
            }
            for sku, name, category, cost, price in PRODUCTS
        ],
    )
    return added
