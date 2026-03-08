import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models import Alert, Machine
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

    # Alert stats in 24h window
    alert_stats = await session.execute(
        select(
            func.count().label("total"),
            func.count().filter(Alert.anomaly_type == "severe").label("critical"),
            func.count().filter(Alert.anomaly_type == "moderate").label("warning"),
            func.count().filter(Alert.action.isnot(None)).label("resolved"),
        ).where(Alert.timestamp >= window_start)
    )
    alert_row = alert_stats.one()
    total_alerts_24h: int = alert_row.total
    critical_alerts: int = alert_row.critical
    warning_alerts: int = alert_row.warning
    resolved_count: int = alert_row.resolved

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

    bucket_expr = func.time_bucket(text(f"INTERVAL '{interval}'"), Alert.timestamp)

    query = (
        select(
            bucket_expr.label("bucket"),
            func.count().label("alert_count"),
            Alert.machine.label("machine"),
        )
        .where(Alert.timestamp >= since)
        .group_by(bucket_expr, Alert.machine)
        .order_by(bucket_expr)
    )

    if machine_id is not None:
        query = query.where(Alert.machine_id == machine_id)

    result = await session.execute(query)
    rows = result.all()

    return [
        AlertTrendPoint(bucket=row.bucket, count=row.alert_count, machine=row.machine)
        for row in rows
    ]


@router.get("/machine-health", response_model=list[MachineHealthSummary])
async def get_machine_health(
    session: AsyncSession = Depends(get_session),
) -> list[MachineHealthSummary]:
    # Subquery: per-machine alert aggregates
    alert_agg = (
        select(
            Alert.machine_id.label("machine_id"),
            func.count().label("total_alerts"),
            func.count().filter(Alert.action.is_(None)).label("active_alerts"),
            func.count().filter(Alert.anomaly_type == "severe").label("critical_count"),
            func.count().filter(Alert.anomaly_type == "moderate").label("warning_count"),
            func.max(Alert.timestamp).label("last_alert_at"),
        )
        .group_by(Alert.machine_id)
        .subquery()
    )

    query = (
        select(
            Machine.id.label("machine_id"),
            Machine.name.label("machine_name"),
            func.coalesce(alert_agg.c.total_alerts, 0).label("total_alerts"),
            func.coalesce(alert_agg.c.active_alerts, 0).label("active_alerts"),
            func.coalesce(alert_agg.c.critical_count, 0).label("critical_count"),
            func.coalesce(alert_agg.c.warning_count, 0).label("warning_count"),
            alert_agg.c.last_alert_at.label("last_alert_at"),
        )
        .outerjoin(alert_agg, Machine.id == alert_agg.c.machine_id)
        .order_by(Machine.name)
    )

    result = await session.execute(query)
    rows = result.all()

    return [
        MachineHealthSummary(
            machine_id=row.machine_id,
            machine_name=row.machine_name,
            total_alerts=row.total_alerts,
            active_alerts=row.active_alerts,
            critical_count=row.critical_count,
            warning_count=row.warning_count,
            last_alert_at=row.last_alert_at,
        )
        for row in rows
    ]
