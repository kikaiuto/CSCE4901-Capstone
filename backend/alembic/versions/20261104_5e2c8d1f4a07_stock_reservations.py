"""Add stock_reservations and the ledger's adjustment reason.

InventoryContract.reserve commits stock against a sales order before it ships.
No existing table holds that, so stock_reservations does, append-only like the
ledger: +quantity on reserve, -quantity on release or ship. inventory_ledger.reason
keeps the reason InventoryContract.adjust requires.

Revision ID: 5e2c8d1f4a07
Revises: 7c5e1a9b3d42
"""

import sqlalchemy as sa

from alembic import op

revision = "5e2c8d1f4a07"
down_revision = "7c5e1a9b3d42"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("inventory_ledger", sa.Column("reason", sa.String(255)))
    op.create_table(
        "stock_reservations",
        sa.Column("reservation_id", sa.Uuid(), primary_key=True),
        sa.Column(
            "organization_id",
            sa.Uuid(),
            sa.ForeignKey("organizations.organization_id"),
            nullable=False,
        ),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("document_kind", sa.String(30), nullable=False),
        sa.Column("document_id", sa.Uuid(), nullable=False),
        sa.Column("document_number", sa.String(150), nullable=False),
        sa.Column("change_quantity", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Uuid()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "product_id"], ["products.organization_id", "products.product_id"]
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "user_id"], ["users.organization_id", "users.user_id"]
        ),
        sa.CheckConstraint("change_quantity <> 0", name="ck_stock_reservation_nonzero"),
    )
    op.create_index(
        "ix_stock_reservations_document", "stock_reservations", ["organization_id", "document_id"]
    )
    op.create_index(
        "ix_stock_reservations_product", "stock_reservations", ["organization_id", "product_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_stock_reservations_product", table_name="stock_reservations")
    op.drop_index("ix_stock_reservations_document", table_name="stock_reservations")
    op.drop_table("stock_reservations")
    op.drop_column("inventory_ledger", "reason")
