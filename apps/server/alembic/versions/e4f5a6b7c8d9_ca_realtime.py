"""ca_realtime

Revision ID: e4f5a6b7c8d9
Revises: d3e4f5a6b7c8
Create Date: 2026-03-09 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e4f5a6b7c8d9"
down_revision: str | Sequence[str] | None = "d3e4f5a6b7c8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("""
        ALTER MATERIALIZED VIEW alerts_hourly_stats
        SET (timescaledb.materialized_only = false)
    """)


def downgrade() -> None:
    op.execute("""
        ALTER MATERIALIZED VIEW alerts_hourly_stats
        SET (timescaledb.materialized_only = true)
    """)
