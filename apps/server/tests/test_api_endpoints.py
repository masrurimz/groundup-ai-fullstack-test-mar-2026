from httpx import AsyncClient


async def test_list_alerts_returns_records(test_client: AsyncClient) -> None:
    response = await test_client.get("/api/v1/alerts")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["machine"] == "Milling Machine"
    assert data[0]["machine_id"] is not None
    assert data[1]["machine"] == "CNC Machine"


async def test_list_alerts_filter_by_anomaly(test_client: AsyncClient) -> None:
    response = await test_client.get("/api/v1/alerts", params={"anomaly": "Severe"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["anomaly_type"] == "Severe"


async def test_patch_alert_updates_fields(test_client: AsyncClient) -> None:
    reasons_response = await test_client.get(
        "/api/v1/lookup/reasons", params={"machine": "CNC Machine"}
    )
    actions_response = await test_client.get("/api/v1/lookup/actions")

    reason_id = reasons_response.json()[0]["id"].split("-")[-1]
    action_id = actions_response.json()[0]["id"].split("-")[-1]

    payload = {
        "suspected_reason_id": int(reason_id),
        "action_id": int(action_id),
        "comment": "Operator verified",
    }
    response = await test_client.patch("/api/v1/alerts/1", json=payload)

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
    assert reasons[0]["name"] == "Spindle Error"
    assert reasons[0]["category"] == "reasons"
    assert actions_response.status_code == 200
    actions = actions_response.json()
    assert len(actions) == 2
    assert actions[0]["category"] == "actions"
    assert machines_response.status_code == 200
    machines = machines_response.json()
    assert len(machines) == 2
    assert machines[0]["category"] == "machines"


async def test_lookup_create_and_update(test_client: AsyncClient) -> None:
    created_machine = await test_client.post("/api/v1/lookup/machines", json={"name": " Lathe  A "})
    assert created_machine.status_code == 201
    machine_data = created_machine.json()
    assert machine_data["name"] == "Lathe A"

    machine_id = int(machine_data["id"].split("-")[-1])
    updated_machine = await test_client.patch(
        f"/api/v1/lookup/machines/{machine_id}",
        json={"is_active": False},
    )
    assert updated_machine.status_code == 200
    assert updated_machine.json()["is_active"] is False


async def test_lookup_schema_validation_rejects_blank_values(test_client: AsyncClient) -> None:
    response = await test_client.post("/api/v1/lookup/machines", json={"name": "   "})
    assert response.status_code == 422


async def test_media_endpoints(test_client: AsyncClient) -> None:
    audio_response = await test_client.get("/api/v1/alerts/1/audio")
    waveform_response = await test_client.get("/api/v1/alerts/1/waveform")

    assert audio_response.status_code == 200
    assert audio_response.headers["content-type"] == "audio/wav"
    assert waveform_response.status_code == 200
    waveform_data = waveform_response.json()
    assert len(waveform_data["times"]) > 0
    assert len(waveform_data["times"]) == len(waveform_data["amplitudes"])


async def test_audio_endpoint_supports_range_requests(test_client: AsyncClient) -> None:
    range_response = await test_client.get(
        "/api/v1/alerts/1/audio",
        headers={"Range": "bytes=0-99"},
    )

    assert range_response.status_code == 206
    assert range_response.headers["accept-ranges"] == "bytes"
    assert range_response.headers["content-range"].startswith("bytes 0-99/")
    assert range_response.headers["content-length"] == "100"
    assert len(range_response.content) == 100
