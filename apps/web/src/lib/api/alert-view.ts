import type { AlertResponse as Alert } from "../api-client";

export type AlertView = {
  id: string;
  serial_number: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
  machine: string;
  machine_id: string | null;
  anomaly_type: string;
  sensor: string;
  sound_clip: string;
  suspected_reason: string | null;
  suspected_reason_id: string | null;
  action: string | null;
  action_id: string | null;
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
    id: alert.id,
    serial_number: alert.serial_number,
    title: `${alert.machine} ${alert.anomaly_type}`,
    description: `${alert.machine} sensor ${alert.sensor}`,
    severity: mapSeverity(alert.anomaly_type),
    status: alert.status,
    created_at: alert.timestamp,
    updated_at: alert.timestamp,
    machine: alert.machine,
    machine_id: alert.machine_id,
    anomaly_type: alert.anomaly_type,
    sensor: alert.sensor,
    sound_clip: alert.sound_clip,
    suspected_reason: alert.suspected_reason,
    suspected_reason_id: alert.suspected_reason_id,
    action: alert.action,
    action_id: alert.action_id,
    comment: alert.comment,
  };
}

export function toAlertViews(alerts: Alert[]): AlertView[] {
  return alerts.map(toAlertView);
}
