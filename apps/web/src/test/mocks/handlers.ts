import { http, HttpResponse } from "msw";

const BASE = "http://localhost:8000";

const MACHINE_M1 = {
  id: "m1",
  key: "cnc-machine",
  name: "CNC Machine",
  is_active: true,
};

const ALERT_A1 = {
  id: "a1",
  serial_number: 1,
  machine: "CNC Machine",
  machine_id: "m1",
  anomaly_type: "Mild",
  sensor: "1234",
  sensor_id: "s1",
  sound_clip: "1.wav",
  suspected_reason: null,
  suspected_reason_id: null,
  action: null,
  action_id: null,
  comment: null,
  updated_at: null,
  updated_by: null,
  timestamp: "2024-01-01T00:00:00Z",
};

export const handlers = [
  // Machines
  http.get(`${BASE}/api/v1/lookup/machines`, () => HttpResponse.json([MACHINE_M1])),

  http.post(`${BASE}/api/v1/lookup/machines`, () =>
    HttpResponse.json(
      { id: "m2", key: "new-machine", name: "New Machine", is_active: true },
      { status: 201 },
    ),
  ),

  http.patch(`${BASE}/api/v1/lookup/machines/:machine_id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...MACHINE_M1, ...body });
  }),

  // Sensors
  http.get(`${BASE}/api/v1/lookup/sensors`, () =>
    HttpResponse.json([
      {
        id: "s1",
        key: "1234",
        serial: "1234",
        name: "Sensor 1234",
        is_active: true,
        machine_id: "m1",
        machine_name: "CNC Machine",
      },
    ]),
  ),

  http.post(`${BASE}/api/v1/lookup/sensors`, () =>
    HttpResponse.json(
      {
        id: "s2",
        key: "5678",
        serial: "5678",
        name: "Sensor 5678",
        is_active: true,
        machine_id: "m1",
        machine_name: "CNC Machine",
      },
      { status: 201 },
    ),
  ),

  // Alerts
  http.get(`${BASE}/api/v1/alerts`, () => HttpResponse.json([ALERT_A1])),

  http.patch(`${BASE}/api/v1/alerts/:alert_id`, () =>
    HttpResponse.json({
      id: "a1",
      serial_number: 1,
      machine: "CNC Machine",
      machine_id: "m1",
      anomaly_type: "Mild",
      sensor: "1234",
      sensor_id: "s1",
      sound_clip: "1.wav",
      suspected_reason: "Spindle Error",
      suspected_reason_id: "r1",
      action: "Immediate",
      action_id: "act1",
      comment: "ok",
      updated_at: "2024-01-02T00:00:00Z",
      updated_by: "admin-ui",
      timestamp: "2024-01-01T00:00:00Z",
    }),
  ),
];
