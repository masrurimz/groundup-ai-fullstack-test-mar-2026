/**
 * Alerts API adapter using generated OpenAPI SDK.
 * Uses generated OpenAPI types as the source of truth.
 */

import {
  getAlertApiV1AlertsAlertIdGet,
  getWaveformApiV1AlertsAlertIdWaveformGet,
  listAlertsApiV1AlertsGet,
  updateAlertApiV1AlertsAlertIdPatch,
  type AlertResponse,
  type AlertUpdateRequest,
  type WaveformResponse,
} from "../api-client";

import { getApiClient } from "./client";
import { getApiV1BaseUrl } from "./config";

export type Alert = AlertResponse;
export type { WaveformResponse };

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
  const { data } = await listAlertsApiV1AlertsGet({
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
  const { data } = await getAlertApiV1AlertsAlertIdGet({
    client: getApiClient(),
    path: { alert_id: alertId },
  });
  return data!;
}

/**
 * Update mutable alert fields.
 */
export async function updateAlert(id: string, payload: AlertUpdateRequest): Promise<Alert> {
  const alertId = Number(id);
  const { data } = await updateAlertApiV1AlertsAlertIdPatch({
    client: getApiClient(),
    path: { alert_id: alertId },
    body: payload,
  });
  return data!;
}

/**
 * Fetch waveform data for an alert.
 */
export async function fetchWaveform(id: string): Promise<WaveformResponse> {
  const alertId = Number(id);
  const { data } = await getWaveformApiV1AlertsAlertIdWaveformGet({
    client: getApiClient(),
    path: { alert_id: alertId },
  });
  return data!;
}

/**
 * Get the direct audio URL for an alert.
 */
export function getAlertAudioUrl(id: string): string {
  return `${getApiV1BaseUrl()}/alerts/${id}/audio`;
}

/**
 * Get the direct spectrogram image URL for an alert.
 */
export function getAlertSpectrogramUrl(id: string): string {
  return `${getApiV1BaseUrl()}/alerts/${id}/spectrogram`;
}
