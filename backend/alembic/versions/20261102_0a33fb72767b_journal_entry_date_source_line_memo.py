"""Add the journal fields R19 needs: entry date, Manual / Auto source, line memo.

The entry memo reuses the existing journal_entries.description column.

Revision ID: 0a33fb72767b
Revises: 4b1d7e9a2c30
"""

import sqlalchemy as sa

from alembic import op

revision = "0a33fb72767b"
down_revision = "4b1d7e9a2c30"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing rows get their creation date; new rows always carry an explicit date.
    op.add_column(
        "journal_entries",
        sa.Column("entry_date", sa.Date(), nullable=False, server_default=sa.text("CURRENT_DATE")),
    )
    op.alter_column("journal_entries", "entry_date", server_default=None)
    op.add_column(
        "journal_entries",
        sa.Column("source", sa.String(10), nullable=False, server_default="manual"),
    )
    op.create_check_constraint(
        "ck_journal_entry_source", "journal_entries", "source IN ('manual', 'auto')"
    )
    op.add_column("journal_entry_lines", sa.Column("memo", sa.String(500)))


def downgrade() -> None:
    op.drop_column("journal_entry_lines", "memo")
    op.drop_constraint("ck_journal_entry_source", "journal_entries", type_="check")
    op.drop_column("journal_entries", "source")
    op.drop_column("journal_entries", "entry_date")
