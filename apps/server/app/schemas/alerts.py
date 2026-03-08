import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class AlertResponse(BaseModel):
    id: uuid.UUID
    serial_number: int
    timestamp: datetime
    machine: str
    machine_id: uuid.UUID | None
    anomaly_type: str
    sensor: str
    sensor_id: uuid.UUID | None
    sound_clip: str
    suspected_reason: str | None
    suspected_reason_id: uuid.UUID | None
    action: str | None
    action_id: uuid.UUID | None
    comment: str | None
    updated_at: datetime | None
    updated_by: str | None
    status: str  # "resolved" | "unresolved" — computed by hybrid_property

    model_config = ConfigDict(from_attributes=True)


class AlertUpdateRequest(BaseModel):
    suspected_reason_id: uuid.UUID | None = None
    action_id: uuid.UUID | None = None
    comment: str | None = Field(default=None, max_length=2000)

    @field_validator("comment")
    @classmethod
    def normalize_comment(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized if normalized else None

    @model_validator(mode="after")
    def ensure_non_empty_patch(self) -> "AlertUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one field must be provided")
        return self


class AlertListQuery(BaseModel):
    machine: str | None = None
    anomaly: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class WaveformResponse(BaseModel):
    alert_id: uuid.UUID
    sample_rate: int
    duration_seconds: float
    times: list[float]
    amplitudes: list[float]
