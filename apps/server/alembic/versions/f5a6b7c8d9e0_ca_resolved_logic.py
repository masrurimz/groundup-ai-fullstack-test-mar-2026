"""ca_resolved_logic

Revision ID: f5a6b7c8d9e0
Revises: e4f5a6b7c8d9
Create Date: 2026-03-09 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "f5a6b7c8d9e0"
down_revision: str | Sequence[str] | None = "e4f5a6b7c8d9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("SELECT remove_continuous_aggregate_policy('alerts_hourly_stats')")
    op.execute("DROP MATERIALIZED VIEW alerts_hourly_stats")
    op.execute("""
        CREATE MATERIALIZED VIEW alerts_hourly_stats
        WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 hour', timestamp) AS bucket,
            machine_id, machine, anomaly_type,
            count(*) AS alert_count,
            count(*) FILTER (WHERE action IS NULL OR suspected_reason IS NULL) AS unresolved_count
        FROM alerts
        GROUP BY bucket, machine_id, machine, anomaly_type
        WITH NO DATA
    """)
    op.execute(
        """ALTER MATERIALIZED VIEW alerts_hourly_stats SET (timescaledb.materialized_only = false)"""  # noqa: E501
    )
    op.execute("""SELECT add_continuous_aggregate_policy('alerts_hourly_stats',
        start_offset => INTERVAL '3 hours', end_offset => INTERVAL '1 hour',
        schedule_interval => INTERVAL '30 minutes')""")


def downgrade() -> None:
    op.execute("SELECT remove_continuous_aggregate_policy('alerts_hourly_stats')")
    op.execute("DROP MATERIALIZED VIEW alerts_hourly_stats")
    op.execute("""
        CREATE MATERIALIZED VIEW alerts_hourly_stats
        WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 hour', timestamp) AS bucket,
            machine_id, machine, anomaly_type,
            count(*) AS alert_count,
            count(*) FILTER (WHERE action IS NULL) AS unresolved_count
        FROM alerts
        GROUP BY bucket, machine_id, machine, anomaly_type
        WITH NO DATA
    """)
    op.execute(
        """ALTER MATERIALIZED VIEW alerts_hourly_stats SET (timescaledb.materialized_only = false)"""  # noqa: E501
    )
    op.execute("""SELECT add_continuous_aggregate_policy('alerts_hourly_stats',
        start_offset => INTERVAL '3 hours', end_offset => INTERVAL '1 hour',
        schedule_interval => INTERVAL '30 minutes')""")
