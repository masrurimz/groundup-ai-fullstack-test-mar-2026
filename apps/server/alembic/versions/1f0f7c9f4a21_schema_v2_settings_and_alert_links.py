"""Schema v2: settings model + alert links (no backfill).

Revision ID: 1f0f7c9f4a21
Revises: 69333faeabcc
Create Date: 2026-03-08 11:35:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1f0f7c9f4a21"
down_revision: str | Sequence[str] | None = "69333faeabcc"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema.

    Intentionally no backfill/reconciliation because this project has no production data yet.
    """
    op.create_table(
        "machines",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )

    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("operation", sa.String(length=50), nullable=False),
        sa.Column("actor", sa.String(length=100), nullable=True),
        sa.Column("before_json", sa.JSON(), nullable=True),
        sa.Column("after_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.drop_table("reasons")
    op.drop_table("actions")

    op.create_table(
        "actions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("action", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )

    op.create_table(
        "reasons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("machine_id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["machine_id"], ["machines.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("machine_id", "key", name="uq_reasons_machine_key"),
    )

    op.add_column("alerts", sa.Column("machine_id", sa.Integer(), nullable=True))
    op.add_column("alerts", sa.Column("suspected_reason_id", sa.Integer(), nullable=True))
    op.add_column("alerts", sa.Column("action_id", sa.Integer(), nullable=True))
    op.add_column("alerts", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("alerts", sa.Column("updated_by", sa.String(length=100), nullable=True))

    op.create_index("ix_alerts_machine_id", "alerts", ["machine_id"], unique=False)
    op.create_index("ix_alerts_suspected_reason_id", "alerts", ["suspected_reason_id"], unique=False)
    op.create_index("ix_alerts_action_id", "alerts", ["action_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_alerts_action_id", table_name="alerts")
    op.drop_index("ix_alerts_suspected_reason_id", table_name="alerts")
    op.drop_index("ix_alerts_machine_id", table_name="alerts")

    op.drop_column("alerts", "updated_by")
    op.drop_column("alerts", "updated_at")
    op.drop_column("alerts", "action_id")
    op.drop_column("alerts", "suspected_reason_id")
    op.drop_column("alerts", "machine_id")

    op.drop_table("reasons")
    op.drop_table("actions")

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

    op.drop_table("audit_log")
    op.drop_table("machines")
