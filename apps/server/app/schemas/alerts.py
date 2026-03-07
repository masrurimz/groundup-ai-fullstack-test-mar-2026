from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class AlertResponse(BaseModel):
    id: int
    timestamp: datetime
    machine: str
    anomaly_type: str
    sensor: str
    sound_clip: str
    suspected_reason: str | None
    action: str | None
    comment: str | None

    model_config = ConfigDict(from_attributes=True)


class AlertUpdateRequest(BaseModel):
    suspected_reason: str | None = None
    action: str | None = None
    comment: str | None = None


class AlertListQuery(BaseModel):
    machine: str | None = None
    anomaly: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class WaveformResponse(BaseModel):
    alert_id: int
    sample_rate: int
    duration_seconds: float
    times: list[float]
    amplitudes: list[float]
