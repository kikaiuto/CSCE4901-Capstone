"""Add the two columns the frozen contracts need.

inventory_ledger.unit_cost is the moving average cost a row moved at, which
InventoryContract.ship returns for COGS. purchase_order_lines.quantity_received
tracks partial receipts (PARTIALLY_RECEIVED).

Revision ID: 4b1d7e9a2c30
Revises: 9f3c2a1b7d60
"""

import sqlalchemy as sa

from alembic import op

revision = "4b1d7e9a2c30"
down_revision = "9f3c2a1b7d60"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "inventory_ledger",
        sa.Column("unit_cost", sa.Numeric(12, 4), nullable=False, server_default="0"),
    )
    op.create_check_constraint(
        "ck_inventory_ledger_nonnegative_cost", "inventory_ledger", "unit_cost >= 0"
    )
    op.add_column(
        "purchase_order_lines",
        sa.Column("quantity_received", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_check_constraint(
        "ck_purchase_order_line_received_range",
        "purchase_order_lines",
        "quantity_received >= 0 AND quantity_received <= quantity",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_purchase_order_line_received_range", "purchase_order_lines", type_="check"
    )
    op.drop_column("purchase_order_lines", "quantity_received")
    op.drop_constraint("ck_inventory_ledger_nonnegative_cost", "inventory_ledger", type_="check")
    op.drop_column("inventory_ledger", "unit_cost")
