"""alerts_hypertable

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-03-08 18:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c2d3e4f5a6b7"
down_revision: str | Sequence[str] | None = "b1c2d3e4f5a6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("alerts_pkey", "alerts", type_="primary")
    op.create_primary_key("alerts_pkey", "alerts", ["id", "timestamp"])
    op.execute("SELECT create_hypertable('alerts', by_range('timestamp'), migrate_data => true)")
    op.execute("""
        ALTER TABLE alerts SET (
            timescaledb.compress,
            timescaledb.compress_segmentby = 'machine_id',
            timescaledb.compress_orderby = 'timestamp DESC'
        )
    """)
    op.execute("SELECT add_compression_policy('alerts', INTERVAL '7 days')")
    op.create_index("ix_alerts_machine_id_ts", "alerts", ["machine_id", "timestamp"])
    op.create_index("ix_alerts_anomaly_type_ts", "alerts", ["anomaly_type", "timestamp"])


def downgrade() -> None:
    op.drop_index("ix_alerts_anomaly_type_ts", "alerts")
    op.drop_index("ix_alerts_machine_id_ts", "alerts")
    # Note: cannot easily un-hypertable; downgrade is a no-op for hypertable conversion
    op.drop_constraint("alerts_pkey", "alerts", type_="primary")
    op.create_primary_key("alerts_pkey", "alerts", ["id"])
