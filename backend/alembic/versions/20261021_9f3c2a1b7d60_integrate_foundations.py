"""Add account status, tenant indexes, and the agreed ledger precision.

Revision ID: 9f3c2a1b7d60
Revises: eb867def2d3c
"""

import sqlalchemy as sa

from alembic import op

revision = "9f3c2a1b7d60"
down_revision = "eb867def2d3c"
branch_labels = None
depends_on = None

TENANT_TABLES = (
    "roles",
    "users",
    "customers",
    "suppliers",
    "chart_of_accounts",
    "journal_entries",
    "journal_entry_lines",
    "product_categories",
    "products",
    "inventory_ledger",
    "sales_orders",
    "sales_order_lines",
    "purchase_orders",
    "purchase_order_lines",
)


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("full_name", sa.String(200), nullable=False, server_default="")
    )
    op.add_column(
        "users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true())
    )
    for table in TENANT_TABLES:
        op.create_index(f"ix_{table}_organization_id", table, ["organization_id"])
    for column in ("debit", "credit"):
        op.alter_column(
            "journal_entry_lines",
            column,
            existing_type=sa.Numeric(12, 2),
            type_=sa.Numeric(15, 2),
            existing_nullable=False,
        )


def downgrade() -> None:
    # PostgreSQL refuses the narrowing if any amount no longer fits; it does not truncate it.
    for column in ("debit", "credit"):
        op.alter_column(
            "journal_entry_lines",
            column,
            existing_type=sa.Numeric(15, 2),
            type_=sa.Numeric(12, 2),
            existing_nullable=False,
        )
    for table in reversed(TENANT_TABLES):
        op.drop_index(f"ix_{table}_organization_id", table_name=table)
    op.drop_column("users", "is_active")
    op.drop_column("users", "full_name")
