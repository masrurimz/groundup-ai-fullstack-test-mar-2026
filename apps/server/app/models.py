from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    machine: Mapped[str] = mapped_column(String(100))
    anomaly_type: Mapped[str] = mapped_column(String(100))
    sensor: Mapped[str] = mapped_column(String(100))
    sound_clip: Mapped[str] = mapped_column(String(255))
    suspected_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    action: Mapped[str | None] = mapped_column(Text, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)


class Reason(Base):
    __tablename__ = "reasons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    machine: Mapped[str] = mapped_column(String(100))
    reason: Mapped[str] = mapped_column(String(255))


class Action(Base):
    __tablename__ = "actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    action: Mapped[str] = mapped_column(String(255))
