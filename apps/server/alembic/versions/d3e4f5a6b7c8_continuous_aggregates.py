"""continuous_aggregates

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-03-08 18:01:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d3e4f5a6b7c8"
down_revision: str | Sequence[str] | None = "c2d3e4f5a6b7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("""
        CREATE MATERIALIZED VIEW alerts_hourly_stats
        WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 hour', timestamp) AS bucket,
            machine_id,
            machine,
            anomaly_type,
            count(*) AS alert_count,
            count(*) FILTER (WHERE action IS NULL) AS unresolved_count
        FROM alerts
        GROUP BY bucket, machine_id, machine, anomaly_type
        WITH NO DATA
    """)
    op.execute("""
        SELECT add_continuous_aggregate_policy('alerts_hourly_stats',
            start_offset => INTERVAL '3 hours',
            end_offset => INTERVAL '1 hour',
            schedule_interval => INTERVAL '30 minutes'
        )
    """)


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS alerts_hourly_stats CASCADE")
