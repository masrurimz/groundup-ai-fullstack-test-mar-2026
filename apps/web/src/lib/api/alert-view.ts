import type { Alert } from "./alerts";

export type AlertView = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
  machine: string;
  anomaly_type: string;
  sensor: string;
  sound_clip: string;
  suspected_reason: string | null;
  action: string | null;
  comment: string | null;
};

function mapSeverity(anomalyType: string): string {
  const normalized = anomalyType.toLowerCase();
  if (normalized === "severe") {
    return "critical";
  }
  if (normalized === "moderate") {
    return "warning";
  }
  return "info";
}

export function toAlertView(alert: Alert): AlertView {
  return {
    id: `${alert.id}`,
    title: `${alert.machine} ${alert.anomaly_type}`,
    description: `${alert.machine} sensor ${alert.sensor}`,
    severity: mapSeverity(alert.anomaly_type),
    status: alert.action ? "acknowledged" : "active",
    created_at: alert.timestamp,
    updated_at: alert.timestamp,
    machine: alert.machine,
    anomaly_type: alert.anomaly_type,
    sensor: alert.sensor,
    sound_clip: alert.sound_clip,
    suspected_reason: alert.suspected_reason,
    action: alert.action,
    comment: alert.comment,
  };
}

export function toAlertViews(alerts: Alert[]): AlertView[] {
  return alerts.map(toAlertView);
}
