/**
 * Alerts API adapter using generated OpenAPI SDK.
 * Uses generated OpenAPI types as the source of truth.
 */

import {
  getAlertApiV1AlertsAlertIdGet,
  listAlertsApiV1AlertsGet,
  updateAlertApiV1AlertsAlertIdPatch,
  type AlertResponse,
  type AlertUpdateRequest,
} from "../api-client";

import { getApiClient } from "./client";

export type Alert = AlertResponse;

export interface AlertsQuery {
  machine?: string;
  anomaly?: string;
  start_date?: string;
  end_date?: string;
}

function unwrapResponse<T>(result: unknown): T | undefined {
  if (result && typeof result === "object" && !Array.isArray(result) && "data" in result) {
    return (result as { data?: T }).data;
  }

  return result as T;
}

/**
 * Fetch all alerts from backend.
 */
export async function fetchAlerts(query?: AlertsQuery): Promise<Alert[]> {
  const result = await listAlertsApiV1AlertsGet({
    client: getApiClient(),
    query,
  });

  return unwrapResponse<Alert[]>(result) ?? [];
}

/**
 * Fetch a single alert by ID.
 */
export async function fetchAlert(id: string): Promise<Alert> {
  const alertId = Number(id);
  const result = await getAlertApiV1AlertsAlertIdGet({
    client: getApiClient(),
    path: { alert_id: alertId },
  });

  const alert = unwrapResponse<Alert>(result);
  if (!alert) {
    throw new Error(`Alert ${id} not found`);
  }

  return alert;
}

/**
 * Update mutable alert fields.
 */
export async function updateAlert(id: string, payload: AlertUpdateRequest): Promise<Alert> {
  const alertId = Number(id);
  const result = await updateAlertApiV1AlertsAlertIdPatch({
    client: getApiClient(),
    path: { alert_id: alertId },
    body: payload,
  });

  const alert = unwrapResponse<Alert>(result);
  if (!alert) {
    throw new Error(`Alert ${id} update returned no payload`);
  }

  return alert;
}
