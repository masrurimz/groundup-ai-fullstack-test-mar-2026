import uuid

from httpx import AsyncClient


async def _get_cnc_alert_id(test_client: AsyncClient) -> str:
    resp = await test_client.get("/api/v1/alerts")
    assert resp.status_code == 200
    alerts = resp.json()
    cnc_alert = next(a for a in alerts if a["machine"] == "CNC Machine")
    return cnc_alert["id"]


async def _get_cnc_machine_id(test_client: AsyncClient) -> str:
    resp = await test_client.get("/api/v1/lookup/machines")
    assert resp.status_code == 200
    machines = resp.json()
    cnc = next(m for m in machines if m["name"] == "CNC Machine")
    return cnc["id"]


async def _get_cnc_reason_id(test_client: AsyncClient) -> str:
    resp = await test_client.get("/api/v1/lookup/reasons", params={"machine": "CNC Machine"})
    assert resp.status_code == 200
    reasons = resp.json()
    spindle = next(r for r in reasons if r["reason"] == "Spindle Error")
    return spindle["id"]


async def _get_immediate_action_id(test_client: AsyncClient) -> str:
    resp = await test_client.get("/api/v1/lookup/actions")
    assert resp.status_code == 200
    actions = resp.json()
    immediate = next(a for a in actions if a["action"] == "Immediate")
    return immediate["id"]


async def test_update_alert_sets_reason_and_action(test_client: AsyncClient) -> None:
    alert_id = await _get_cnc_alert_id(test_client)
    reason_id = await _get_cnc_reason_id(test_client)
    action_id = await _get_immediate_action_id(test_client)

    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"suspected_reason_id": reason_id, "action_id": action_id},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["suspected_reason"] == "Spindle Error"
    assert data["suspected_reason_id"] == reason_id
    assert data["action"] == "Immediate"
    assert data["action_id"] == action_id


async def test_update_alert_sets_comment_only(test_client: AsyncClient) -> None:
    alert_id = await _get_cnc_alert_id(test_client)

    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"comment": "check the spindle"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["comment"] == "check the spindle"
    assert data["suspected_reason"] is None
    assert data["action"] is None


async def test_update_alert_clears_reason_to_null(test_client: AsyncClient) -> None:
    alert_id = await _get_cnc_alert_id(test_client)
    reason_id = await _get_cnc_reason_id(test_client)

    # First set the reason
    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"suspected_reason_id": reason_id},
    )
    assert resp.status_code == 200
    assert resp.json()["suspected_reason_id"] == reason_id

    # Now clear it with explicit null
    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"suspected_reason_id": None},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["suspected_reason"] is None
    assert data["suspected_reason_id"] is None


async def test_update_alert_rejects_nonexistent_reason(test_client: AsyncClient) -> None:
    alert_id = await _get_cnc_alert_id(test_client)
    fake_id = str(uuid.uuid4())

    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"suspected_reason_id": fake_id},
    )
    assert resp.status_code == 404


async def test_update_alert_rejects_inactive_reason(test_client: AsyncClient) -> None:
    alert_id = await _get_cnc_alert_id(test_client)
    machine_id = await _get_cnc_machine_id(test_client)

    # Create a new reason for CNC
    create_resp = await test_client.post(
        "/api/v1/lookup/reasons",
        json={"machine_id": machine_id, "reason": "Temp Inactive Reason"},
    )
    assert create_resp.status_code == 201
    reason_id = create_resp.json()["id"]

    # Deactivate it
    deactivate_resp = await test_client.patch(
        f"/api/v1/lookup/reasons/{reason_id}",
        json={"is_active": False},
    )
    assert deactivate_resp.status_code == 200
    assert deactivate_resp.json()["is_active"] is False

    # Attempt to use the inactive reason
    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"suspected_reason_id": reason_id},
    )
    assert resp.status_code == 400


async def test_update_alert_rejects_reason_from_wrong_machine(test_client: AsyncClient) -> None:
    alert_id = await _get_cnc_alert_id(test_client)

    # Get Milling reason
    resp = await test_client.get("/api/v1/lookup/reasons", params={"machine": "Milling Machine"})
    assert resp.status_code == 200
    milling_reasons = resp.json()
    milling_reason = next(r for r in milling_reasons if r["reason"] == "Machine Crash")
    milling_reason_id = milling_reason["id"]

    # Try to use Milling reason on CNC alert
    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"suspected_reason_id": milling_reason_id},
    )
    assert resp.status_code == 400


async def test_update_alert_rejects_nonexistent_action(test_client: AsyncClient) -> None:
    alert_id = await _get_cnc_alert_id(test_client)
    fake_id = str(uuid.uuid4())

    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"action_id": fake_id},
    )
    assert resp.status_code == 404


async def test_update_alert_rejects_inactive_action(test_client: AsyncClient) -> None:
    alert_id = await _get_cnc_alert_id(test_client)

    # Create a new action
    create_resp = await test_client.post(
        "/api/v1/lookup/actions",
        json={"action": "Temp Inactive Action"},
    )
    assert create_resp.status_code == 201
    action_id = create_resp.json()["id"]

    # Deactivate it
    deactivate_resp = await test_client.patch(
        f"/api/v1/lookup/actions/{action_id}",
        json={"is_active": False},
    )
    assert deactivate_resp.status_code == 200
    assert deactivate_resp.json()["is_active"] is False

    # Attempt to use the inactive action
    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"action_id": action_id},
    )
    assert resp.status_code == 400


async def test_update_alert_rejects_empty_body(test_client: AsyncClient) -> None:
    alert_id = await _get_cnc_alert_id(test_client)

    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={},
    )
    assert resp.status_code == 422


async def test_update_alert_stores_comment_stripped(test_client: AsyncClient) -> None:
    alert_id = await _get_cnc_alert_id(test_client)

    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"comment": "  needs inspection  "},
    )
    assert resp.status_code == 200
    assert resp.json()["comment"] == "needs inspection"


async def test_update_alert_rejects_comment_too_long(test_client: AsyncClient) -> None:
    alert_id = await _get_cnc_alert_id(test_client)

    resp = await test_client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"comment": "x" * 2001},
    )
    assert resp.status_code == 422
