from httpx import AsyncClient


async def test_list_alerts_returns_records(test_client: AsyncClient) -> None:
    response = await test_client.get("/api/v1/alerts")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["machine"] == "CNC Machine"


async def test_list_alerts_filter_by_anomaly(test_client: AsyncClient) -> None:
    response = await test_client.get("/api/v1/alerts", params={"anomaly": "Severe"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["anomaly_type"] == "Severe"


async def test_patch_alert_updates_fields(test_client: AsyncClient) -> None:
    payload = {
        "suspected_reason": "Spindle Error",
        "action": "Immediate",
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

    assert reasons_response.status_code == 200
    assert reasons_response.json() == ["Spindle Error"]
    assert actions_response.status_code == 200
    assert actions_response.json() == ["Immediate", "Later"]


async def test_media_endpoints(test_client: AsyncClient) -> None:
    audio_response = await test_client.get("/api/v1/alerts/1/audio")
    waveform_response = await test_client.get("/api/v1/alerts/1/waveform")

    assert audio_response.status_code == 200
    assert audio_response.headers["content-type"] == "audio/wav"
    assert waveform_response.status_code == 200
    waveform_data = waveform_response.json()
    assert len(waveform_data["times"]) > 0
    assert len(waveform_data["times"]) == len(waveform_data["amplitudes"])
