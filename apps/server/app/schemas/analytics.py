import uuid
from datetime import datetime

from pydantic import BaseModel


class AlertTrendBucket(BaseModel):
    bucket: datetime
    critical: int
    warning: int
    mild: int
    total: int


class MachineHealthSummary(BaseModel):
    machine_id: uuid.UUID
    machine_name: str
    total_alerts: int
    active_alerts: int  # alerts with no action assigned
    critical_count: int  # anomaly_type == 'severe'
    warning_count: int  # anomaly_type == 'moderate'
    last_alert_at: datetime | None


class DashboardOverview(BaseModel):
    total_machines: int
    active_machines: int
    total_alerts_24h: int
    critical_alerts: int
    warning_alerts: int
    mild_alerts: int
    resolved_rate: float  # 0.0-100.0
