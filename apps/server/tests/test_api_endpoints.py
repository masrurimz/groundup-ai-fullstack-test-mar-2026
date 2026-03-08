import re

from httpx import AsyncClient

UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")


def is_uuid(value: object) -> bool:
    return isinstance(value, str) and UUID_RE.match(value) is not None


async def test_list_alerts_returns_records(test_client: AsyncClient) -> None:
    response = await test_client.get("/api/v1/alerts")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["machine"] == "Milling Machine"
    assert is_uuid(data[0]["id"])
    assert data[0]["machine_id"] is not None
    assert is_uuid(data[0]["machine_id"])
    assert data[0]["sensor_id"] is not None
    assert is_uuid(data[0]["sensor_id"])
    assert data[1]["machine"] == "CNC Machine"


async def test_list_alerts_filter_by_anomaly(test_client: AsyncClient) -> None:
    response = await test_client.get("/api/v1/alerts", params={"anomaly": "Severe"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["anomaly_type"] == "Severe"


async def test_patch_alert_updates_fields(test_client: AsyncClient) -> None:
    alerts_response = await test_client.get("/api/v1/alerts")
    alerts = alerts_response.json()
    cnc_alert = next(a for a in alerts if a["machine"] == "CNC Machine")
    alert_id = cnc_alert["id"]

    reasons_response = await test_client.get(
        "/api/v1/lookup/reasons", params={"machine": "CNC Machine"}
    )
    actions_response = await test_client.get("/api/v1/lookup/actions")

    reason_id = reasons_response.json()[0]["id"]
    action_id = actions_response.json()[0]["id"]

    payload = {
        "suspected_reason_id": reason_id,
        "action_id": action_id,
        "comment": "Operator verified",
    }
    response = await test_client.patch(f"/api/v1/alerts/{alert_id}", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["suspected_reason"] == "Spindle Error"
    assert data["action"] == "Immediate"
    assert data["comment"] == "Operator verified"


async def test_lookup_endpoints(test_client: AsyncClient) -> None:
    reasons_response = await test_client.get(
        "/api/v1/lookup/reasons", params={"machine": "CNC Machine"}
    )
    actions_response = await test_client.get("/api/v1/lookup/actions")
    machines_response = await test_client.get("/api/v1/lookup/machines")

    assert reasons_response.status_code == 200
    reasons = reasons_response.json()
    assert len(reasons) == 1
    assert reasons[0]["reason"] == "Spindle Error"
    assert is_uuid(reasons[0]["machine_id"])
    assert reasons[0]["machine_name"] == "CNC Machine"
    assert actions_response.status_code == 200
    actions = actions_response.json()
    assert len(actions) == 2
    assert "key" in actions[0]
    assert machines_response.status_code == 200
    machines = machines_response.json()
    assert len(machines) == 2
    assert "key" in machines[0]


async def test_lookup_create_and_update(test_client: AsyncClient) -> None:
    created_machine = await test_client.post("/api/v1/lookup/machines", json={"name": " Lathe  A "})
    assert created_machine.status_code == 201
    machine_data = created_machine.json()
    assert machine_data["name"] == "Lathe A"

    machine_id = machine_data["id"]
    assert is_uuid(machine_id)
    updated_machine = await test_client.patch(
        f"/api/v1/lookup/machines/{machine_id}",
        json={"is_active": False},
    )
    assert updated_machine.status_code == 200
    assert updated_machine.json()["is_active"] is False


async def test_lookup_schema_validation_rejects_blank_values(test_client: AsyncClient) -> None:
    response = await test_client.post("/api/v1/lookup/machines", json={"name": "   "})
    assert response.status_code == 422


async def test_sensor_crud(test_client: AsyncClient) -> None:
    # List sensors — should have 2 from fixtures
    sensors_response = await test_client.get("/api/v1/lookup/sensors")
    assert sensors_response.status_code == 200
    sensors = sensors_response.json()
    assert len(sensors) == 2
    assert all(is_uuid(s["id"]) for s in sensors)
    assert all(is_uuid(s["machine_id"]) for s in sensors)

    # Get a machine ID for creating a sensor
    machines = (await test_client.get("/api/v1/lookup/machines")).json()
    cnc = next(m for m in machines if m["name"] == "CNC Machine")
    machine_id = cnc["id"]

    # Create sensor
    create_resp = await test_client.post(
        "/api/v1/lookup/sensors",
        json={"machine_id": machine_id, "serial": "9999999999", "name": "Test Sensor"},
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["serial"] == "9999999999"
    assert created["name"] == "Test Sensor"
    assert created["machine_name"] == "CNC Machine"
    assert is_uuid(created["id"])

    # Duplicate serial on same machine → 409
    dup_resp = await test_client.post(
        "/api/v1/lookup/sensors",
        json={"machine_id": machine_id, "serial": "9999999999", "name": "Dup"},
    )
    assert dup_resp.status_code == 409

    # Update sensor name
    sensor_id = created["id"]
    patch_resp = await test_client.patch(
        f"/api/v1/lookup/sensors/{sensor_id}",
        json={"name": "Renamed Sensor"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["name"] == "Renamed Sensor"

    # Deactivate sensor
    deactivate_resp = await test_client.patch(
        f"/api/v1/lookup/sensors/{sensor_id}",
        json={"is_active": False},
    )
    assert deactivate_resp.status_code == 200
    assert deactivate_resp.json()["is_active"] is False

    # Filter by machine
    filtered = await test_client.get("/api/v1/lookup/sensors", params={"machine": "CNC Machine"})
    assert filtered.status_code == 200
    # CNC has 1 active fixture sensor (9999999999 was deactivated)
    assert all(s["machine_name"] == "CNC Machine" for s in filtered.json())


async def test_media_endpoints(test_client: AsyncClient) -> None:
    alerts_response = await test_client.get("/api/v1/alerts")
    alerts = alerts_response.json()
    cnc_alert = next(a for a in alerts if a["machine"] == "CNC Machine")
    alert_id = cnc_alert["id"]

    audio_response = await test_client.get(f"/api/v1/alerts/{alert_id}/audio")
    waveform_response = await test_client.get(f"/api/v1/alerts/{alert_id}/waveform")

    assert audio_response.status_code == 200
    assert audio_response.headers["content-type"] == "audio/wav"
    assert waveform_response.status_code == 200
    waveform_data = waveform_response.json()
    assert len(waveform_data["times"]) > 0
    assert len(waveform_data["times"]) == len(waveform_data["amplitudes"])


async def test_audio_endpoint_supports_range_requests(test_client: AsyncClient) -> None:
    alerts_response = await test_client.get("/api/v1/alerts")
    alerts = alerts_response.json()
    cnc_alert = next(a for a in alerts if a["machine"] == "CNC Machine")
    alert_id = cnc_alert["id"]

    range_response = await test_client.get(
        f"/api/v1/alerts/{alert_id}/audio",
        headers={"Range": "bytes=0-99"},
    )

    assert range_response.status_code == 206
    assert range_response.headers["accept-ranges"] == "bytes"
    assert range_response.headers["content-range"].startswith("bytes 0-99/")
    assert range_response.headers["content-length"] == "100"
    assert len(range_response.content) == 100
