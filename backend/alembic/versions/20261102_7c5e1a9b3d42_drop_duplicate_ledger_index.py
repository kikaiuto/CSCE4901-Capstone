"""Drop the ledger's single-column tenant index.

ix_inventory_ledger_product_time already leads with organization_id, so the
index 9f3c2a1b7d60 added on that column alone duplicates its first column.

Revision ID: 7c5e1a9b3d42
Revises: 0a33fb72767b
"""

from alembic import op

revision = "7c5e1a9b3d42"
down_revision = "0a33fb72767b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_inventory_ledger_organization_id", table_name="inventory_ledger")


def downgrade() -> None:
    op.create_index("ix_inventory_ledger_organization_id", "inventory_ledger", ["organization_id"])
