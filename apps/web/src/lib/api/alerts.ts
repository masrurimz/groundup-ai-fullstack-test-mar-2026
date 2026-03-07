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

/**
 * Fetch all alerts from backend.
 */
export async function fetchAlerts(query?: AlertsQuery): Promise<Alert[]> {
  const data = await listAlertsApiV1AlertsGet({
    client: getApiClient(),
    query,
  });

  return data ?? [];
}

/**
 * Fetch a single alert by ID.
 */
export async function fetchAlert(id: string): Promise<Alert> {
  const alertId = Number(id);
  return getAlertApiV1AlertsAlertIdGet({
    client: getApiClient(),
    path: { alert_id: alertId },
  });
}

/**
 * Update mutable alert fields.
 */
export async function updateAlert(id: string, payload: AlertUpdateRequest): Promise<Alert> {
  const alertId = Number(id);
  return updateAlertApiV1AlertsAlertIdPatch({
    client: getApiClient(),
    path: { alert_id: alertId },
    body: payload,
  });
}
