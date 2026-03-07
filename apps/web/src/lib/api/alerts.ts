/**
 * Alerts API - use shared HTTP boundary for all calls
 * Endpoints aligned with backend /api/v1/alerts routes
 */

import { apiGet, apiPost } from "./http";

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertRequest {
  title: string;
  description: string;
  severity: string;
}

/**
 * Fetch all alerts from backend
 */
export async function fetchAlerts(): Promise<Alert[]> {
  return apiGet<Alert[]>("/alerts");
}

/**
 * Fetch a single alert by ID
 */
export async function fetchAlert(id: string): Promise<Alert> {
  return apiGet<Alert>(`/alerts/${id}`);
}

/**
 * Create a new alert
 */
export async function createAlert(data: CreateAlertRequest): Promise<Alert> {
  return apiPost<Alert>("/alerts", data);
}
