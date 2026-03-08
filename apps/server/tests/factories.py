"""
Reusable factory functions for creating test model instances.

These produce unsaved ORM objects; the caller is responsible for adding them
to a session and flushing/committing.
"""

from datetime import UTC, datetime

from app.models import Action, Alert, Machine, Reason, Sensor

_EPOCH = datetime.fromtimestamp(0, tz=UTC)


def make_machine(
    *,
    name: str = "Test Machine",
    key: str | None = None,
    is_active: bool = True,
    created_at: datetime = _EPOCH,
    updated_at: datetime = _EPOCH,
    **overrides: object,
) -> Machine:
    resolved_key = key if key is not None else name.lower().replace(" ", "-")
    return Machine(
        key=resolved_key,
        name=name,
        is_active=is_active,
        created_at=created_at,
        updated_at=updated_at,
        **overrides,
    )


def make_sensor(
    *,
    machine_id: object,
    serial: str = "0000000001",
    name: str | None = None,
    key: str | None = None,
    is_active: bool = True,
    created_at: datetime = _EPOCH,
    updated_at: datetime = _EPOCH,
    **overrides: object,
) -> Sensor:
    resolved_name = name if name is not None else f"Sensor {serial}"
    resolved_key = key if key is not None else serial
    return Sensor(
        machine_id=machine_id,
        serial=serial,
        name=resolved_name,
        key=resolved_key,
        is_active=is_active,
        created_at=created_at,
        updated_at=updated_at,
        **overrides,
    )


def make_reason(
    *,
    machine_id: object,
    reason: str = "Test Reason",
    key: str | None = None,
    is_active: bool = True,
    created_at: datetime = _EPOCH,
    updated_at: datetime = _EPOCH,
    **overrides: object,
) -> Reason:
    resolved_key = key if key is not None else reason.lower().replace(" ", "-")
    return Reason(
        machine_id=machine_id,
        key=resolved_key,
        reason=reason,
        is_active=is_active,
        created_at=created_at,
        updated_at=updated_at,
        **overrides,
    )


def make_action(
    *,
    action: str = "Test Action",
    key: str | None = None,
    is_active: bool = True,
    created_at: datetime = _EPOCH,
    updated_at: datetime = _EPOCH,
    **overrides: object,
) -> Action:
    resolved_key = key if key is not None else action.lower().replace(" ", "-")
    return Action(
        key=resolved_key,
        action=action,
        is_active=is_active,
        created_at=created_at,
        updated_at=updated_at,
        **overrides,
    )


def make_alert(
    *,
    machine_id: object,
    sensor_id: object,
    machine: str = "Test Machine",
    sensor: str = "0000000001",
    anomaly_type: str = "Mild",
    sound_clip: str = "1.wav",
    timestamp: datetime = _EPOCH,
    suspected_reason: str | None = None,
    suspected_reason_id: object | None = None,
    action: str | None = None,
    action_id: object | None = None,
    comment: str | None = None,
    updated_at: datetime | None = None,
    updated_by: str | None = None,
    **overrides: object,
) -> Alert:
    return Alert(
        machine_id=machine_id,
        sensor_id=sensor_id,
        machine=machine,
        sensor=sensor,
        anomaly_type=anomaly_type,
        sound_clip=sound_clip,
        timestamp=timestamp,
        suspected_reason=suspected_reason,
        suspected_reason_id=suspected_reason_id,
        action=action,
        action_id=action_id,
        comment=comment,
        updated_at=updated_at,
        updated_by=updated_by,
        **overrides,
    )
