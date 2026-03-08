import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models import Machine
from app.schemas.analytics import AlertTrendPoint, DashboardOverview, MachineHealthSummary

router = APIRouter(prefix="/analytics", tags=["analytics"])

_VALID_INTERVALS = {"1 hour", "1 day", "1 week"}


@router.get("/overview", response_model=DashboardOverview)
async def get_overview(
    session: AsyncSession = Depends(get_session),
) -> DashboardOverview:
    now = datetime.now(tz=UTC)
    window_start = now - timedelta(hours=24)

    # Total and active machines
    machine_counts = await session.execute(
        select(
            func.count().label("total"),
            func.count().filter(Machine.is_active.is_(True)).label("active"),
        )
    )
    machine_row = machine_counts.one()
    total_machines: int = machine_row.total
    active_machines: int = machine_row.active
    # Alert stats in 24h window from continuous aggregate
    alert_stats_sql = """
        SELECT
            COALESCE(SUM(alert_count), 0) AS total,
            COALESCE(SUM(alert_count) FILTER (WHERE anomaly_type = 'severe'), 0) AS critical,
            COALESCE(SUM(alert_count) FILTER (WHERE anomaly_type = 'moderate'), 0) AS warning,
            COALESCE(SUM(GREATEST(0, alert_count - unresolved_count)), 0) AS resolved
        FROM alerts_hourly_stats
        WHERE bucket >= :since
    """
    result = await session.execute(
        text(alert_stats_sql),
        {"since": window_start},
    )
    alert_row = result.one()
    total_alerts_24h: int = int(alert_row.total)
    critical_alerts: int = int(alert_row.critical)
    warning_alerts: int = int(alert_row.warning)
    resolved_count: int = int(alert_row.resolved)

    resolved_rate = (resolved_count / total_alerts_24h * 100.0) if total_alerts_24h > 0 else 100.0

    return DashboardOverview(
        total_machines=total_machines,
        active_machines=active_machines,
        total_alerts_24h=total_alerts_24h,
        critical_alerts=critical_alerts,
        warning_alerts=warning_alerts,
        resolved_rate=resolved_rate,
    )


@router.get("/alert-trends", response_model=list[AlertTrendPoint])
async def get_alert_trends(
    interval: str = Query(
        default="1 day", description="Bucket interval: '1 hour', '1 day', or '1 week'"
    ),
    days: int = Query(default=30, ge=1, le=365),
    machine_id: uuid.UUID | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> list[AlertTrendPoint]:
    if interval not in _VALID_INTERVALS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid interval '{interval}'. Must be one of: {sorted(_VALID_INTERVALS)}",
        )

    since = datetime.now(tz=UTC) - timedelta(days=days)

    # interval is validated against _VALID_INTERVALS above — safe to interpolate.
    if machine_id is not None:
        sql = f"""
            SELECT
                time_bucket(INTERVAL '{interval}', bucket) AS bucket,
                SUM(alert_count) AS alert_count,
                machine
            FROM alerts_hourly_stats
            WHERE bucket >= :since
            AND machine_id = :machine_id
            GROUP BY 1, machine
            ORDER BY 1
        """
        params: dict = {"since": since, "machine_id": str(machine_id)}
    else:
        sql = f"""
            SELECT
                time_bucket(INTERVAL '{interval}', bucket) AS bucket,
                SUM(alert_count) AS alert_count,
                machine
            FROM alerts_hourly_stats
            WHERE bucket >= :since
            GROUP BY 1, machine
            ORDER BY 1
        """
        params = {"since": since}

    result = await session.execute(text(sql), params)
    rows = result.all()

    return [
        AlertTrendPoint(bucket=row.bucket, count=int(row.alert_count), machine=row.machine)
        for row in rows
    ]


@router.get("/machine-health", response_model=list[MachineHealthSummary])
async def get_machine_health(
    session: AsyncSession = Depends(get_session),
) -> list[MachineHealthSummary]:
    # Get all machines
    machines_result = await session.execute(select(Machine.id, Machine.name).order_by(Machine.name))
    machines = machines_result.all()

    # Get per-machine alert aggregates from continuous aggregate
    alert_stats_sql = """
        SELECT
            machine_id,
            COALESCE(SUM(alert_count), 0) AS total_alerts,
            COALESCE(SUM(unresolved_count), 0) AS active_alerts,
            COALESCE(SUM(alert_count) FILTER (WHERE anomaly_type = 'severe'), 0) AS critical_count,
            COALESCE(SUM(alert_count) FILTER (WHERE anomaly_type = 'moderate'), 0) AS warning_count,
            MAX(bucket) AS last_alert_at
        FROM alerts_hourly_stats
        GROUP BY machine_id
    """
    result = await session.execute(text(alert_stats_sql))
    alert_rows = result.all()

    # Build lookup dict keyed by machine_id
    alert_data = {row.machine_id: row for row in alert_rows}

    # Join in Python and build response
    return [
        MachineHealthSummary(
            machine_id=row.id,
            machine_name=row.name,
            total_alerts=int(alert_data[row.id].total_alerts) if row.id in alert_data else 0,
            active_alerts=int(alert_data[row.id].active_alerts) if row.id in alert_data else 0,
            critical_count=int(alert_data[row.id].critical_count) if row.id in alert_data else 0,
            warning_count=int(alert_data[row.id].warning_count) if row.id in alert_data else 0,
            last_alert_at=alert_data[row.id].last_alert_at if row.id in alert_data else None,
        )
        for row in machines
    ]
