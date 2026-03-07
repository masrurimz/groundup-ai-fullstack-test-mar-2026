"""Initial migration: alerts, reasons, actions tables.

Revision ID: 69333faeabcc
Revises:
Create Date: 2026-03-07 23:34:21.186665
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "69333faeabcc"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("machine", sa.String(length=100), nullable=False),
        sa.Column("anomaly_type", sa.String(length=100), nullable=False),
        sa.Column("sensor", sa.String(length=100), nullable=False),
        sa.Column("sound_clip", sa.String(length=255), nullable=False),
        sa.Column("suspected_reason", sa.Text(), nullable=True),
        sa.Column("action", sa.Text(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "reasons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("machine", sa.String(length=100), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "actions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("actions")
    op.drop_table("reasons")
    op.drop_table("alerts")
