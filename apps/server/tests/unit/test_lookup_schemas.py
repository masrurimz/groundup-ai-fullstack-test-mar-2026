import uuid

import pytest
from pydantic import ValidationError

from app.schemas.lookup import (
    ActionCreateRequest,
    MachineCreateRequest,
    MachineUpdateRequest,
    ReasonCreateRequest,
    SensorCreateRequest,
    SensorUpdateRequest,
)

# ---------------------------------------------------------------------------
# MachineCreateRequest
# ---------------------------------------------------------------------------


def test_machine_create_blank_name_rejected() -> None:
    with pytest.raises(ValidationError):
        MachineCreateRequest(name="")


def test_machine_create_whitespace_only_name_rejected() -> None:
    with pytest.raises(ValidationError):
        MachineCreateRequest(name="   ")


def test_machine_create_leading_trailing_spaces_normalized() -> None:
    req = MachineCreateRequest(name="  Alpha  ")
    assert req.name == "Alpha"


def test_machine_create_internal_spaces_collapsed() -> None:
    req = MachineCreateRequest(name="Alpha  Beta   Gamma")
    assert req.name == "Alpha Beta Gamma"


def test_machine_create_max_length_accepted() -> None:
    name = "A" * 100
    req = MachineCreateRequest(name=name)
    assert req.name == name


def test_machine_create_exceeds_max_length_rejected() -> None:
    with pytest.raises(ValidationError):
        MachineCreateRequest(name="A" * 101)


# ---------------------------------------------------------------------------
# MachineUpdateRequest
# ---------------------------------------------------------------------------


def test_machine_update_empty_patch_rejected() -> None:
    with pytest.raises(ValidationError):
        MachineUpdateRequest()


def test_machine_update_only_name_accepted() -> None:
    req = MachineUpdateRequest(name="New Name")
    assert req.name == "New Name"
    assert req.is_active is None


def test_machine_update_only_is_active_accepted() -> None:
    req = MachineUpdateRequest(is_active=False)
    assert req.is_active is False
    assert req.name is None


def test_machine_update_name_whitespace_normalized() -> None:
    req = MachineUpdateRequest(name="  My  Machine  ")
    assert req.name == "My Machine"


# ---------------------------------------------------------------------------
# ReasonCreateRequest
# ---------------------------------------------------------------------------


def test_reason_create_blank_reason_rejected() -> None:
    with pytest.raises(ValidationError):
        ReasonCreateRequest(machine_id=uuid.uuid4(), reason="")


def test_reason_create_whitespace_reason_normalized() -> None:
    req = ReasonCreateRequest(machine_id=uuid.uuid4(), reason="  over  heat  ")
    assert req.reason == "over heat"


def test_reason_create_invalid_machine_id_rejected() -> None:
    with pytest.raises(ValidationError):
        ReasonCreateRequest(machine_id="not-a-uuid", reason="Valid reason")  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# ActionCreateRequest
# ---------------------------------------------------------------------------


def test_action_create_blank_action_rejected() -> None:
    with pytest.raises(ValidationError):
        ActionCreateRequest(action="")


def test_action_create_whitespace_collapsed() -> None:
    req = ActionCreateRequest(action="  replace   filter  ")
    assert req.action == "replace filter"


# ---------------------------------------------------------------------------
# SensorCreateRequest
# ---------------------------------------------------------------------------


def test_sensor_create_blank_serial_rejected() -> None:
    with pytest.raises(ValidationError):
        SensorCreateRequest(machine_id=uuid.uuid4(), serial="", name="Sensor A")


def test_sensor_create_blank_name_rejected() -> None:
    with pytest.raises(ValidationError):
        SensorCreateRequest(machine_id=uuid.uuid4(), serial="SN-001", name="")


def test_sensor_create_serial_and_name_normalized() -> None:
    req = SensorCreateRequest(
        machine_id=uuid.uuid4(),
        serial="  SN  001  ",
        name="  Temperature  Sensor  ",
    )
    assert req.serial == "SN 001"
    assert req.name == "Temperature Sensor"


# ---------------------------------------------------------------------------
# SensorUpdateRequest
# ---------------------------------------------------------------------------


def test_sensor_update_empty_patch_rejected() -> None:
    with pytest.raises(ValidationError):
        SensorUpdateRequest()


def test_sensor_update_only_name_accepted() -> None:
    req = SensorUpdateRequest(name="Updated Name")
    assert req.name == "Updated Name"
    assert req.serial is None
    assert req.is_active is None


def test_sensor_update_only_serial_accepted() -> None:
    req = SensorUpdateRequest(serial="SN-999")
    assert req.serial == "SN-999"
    assert req.name is None
    assert req.is_active is None


def test_sensor_update_only_is_active_accepted() -> None:
    req = SensorUpdateRequest(is_active=True)
    assert req.is_active is True
    assert req.name is None
    assert req.serial is None
