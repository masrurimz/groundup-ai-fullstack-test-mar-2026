import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Identity, Integer, String, Text, Uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from uuid_utils import uuid7


class Base(DeclarativeBase):
    pass


class Machine(Base):
    __tablename__ = "machines"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    key: Mapped[str] = mapped_column(String(100), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    baseline_sound_clip: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Sensor(Base):
    __tablename__ = "sensors"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    machine_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("machines.id"))
    serial: Mapped[str] = mapped_column(String(100))
    name: Mapped[str] = mapped_column(String(255))
    key: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Reason(Base):
    __tablename__ = "reasons"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    machine_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("machines.id"))
    key: Mapped[str] = mapped_column(String(255))
    reason: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Action(Base):
    __tablename__ = "actions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    key: Mapped[str] = mapped_column(String(255), unique=True)
    action: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    serial_number: Mapped[int] = mapped_column(
        Integer, Identity(always=True), nullable=False, insert_sentinel=True
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    machine: Mapped[str] = mapped_column(String(100))
    machine_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("machines.id"), nullable=True)
    anomaly_type: Mapped[str] = mapped_column(String(100))
    sensor: Mapped[str] = mapped_column(String(100))
    sensor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sensors.id"), nullable=True)
    sound_clip: Mapped[str] = mapped_column(String(255))
    suspected_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    suspected_reason_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("reasons.id"), nullable=True
    )
    action: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("actions.id"), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String(100), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    operation: Mapped[str] = mapped_column(String(50))
    actor: Mapped[str | None] = mapped_column(String(100), nullable=True)
    before_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
