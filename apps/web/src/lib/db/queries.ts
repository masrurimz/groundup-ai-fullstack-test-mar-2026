/**
 * Alerts Query Hooks
 * Composable TanStack DB live queries with one view-level projection.
 */

import { eq, isNull, not, or } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";

import { alertsCollection } from "./collections";

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

const mapSeverity = (anomalyType: string): string => {
  const normalized = anomalyType.toLowerCase();
  if (normalized === "severe") {
    return "critical";
  }
  if (normalized === "moderate") {
    return "warning";
  }
  return "info";
};

const toAlertView = ({ alert }: { alert: any }): AlertView => ({
  id: String(alert.id),
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
});

export function useAlerts() {
  return useLiveQuery((q) =>
    q
      .from({ alert: alertsCollection })
      .orderBy(({ alert }) => alert.timestamp, "desc")
      .select(toAlertView),
  );
}

export function useAlert(id?: string) {
  return useLiveQuery(
    (q) => {
      if (!id) {
        return null;
      }

      return q
        .from({ alert: alertsCollection })
        .where(({ alert }) => eq(alert.id, Number(id)))
        .select(toAlertView);
    },
    [id],
  );
}

export function useAlertsByStatus(status?: AlertView["status"]) {
  return useLiveQuery(
    (q) => {
      const baseQuery = q
        .from({ alert: alertsCollection })
        .orderBy(({ alert }) => alert.timestamp, "desc");

      if (status === "active") {
        return baseQuery.where(({ alert }) => isNull(alert.action)).select(toAlertView);
      }

      if (status === "acknowledged") {
        return baseQuery.where(({ alert }) => not(isNull(alert.action))).select(toAlertView);
      }

      return baseQuery.select(toAlertView);
    },
    [status],
  );
}

export function useAlertsBySeverity(severity?: AlertView["severity"]) {
  return useLiveQuery(
    (q) => {
      const baseQuery = q
        .from({ alert: alertsCollection })
        .orderBy(({ alert }) => alert.timestamp, "desc");

      if (severity === "critical") {
        return baseQuery.where(({ alert }) => eq(alert.anomaly_type, "severe")).select(toAlertView);
      }

      if (severity === "warning") {
        return baseQuery
          .where(({ alert }) => eq(alert.anomaly_type, "moderate"))
          .select(toAlertView);
      }

      if (severity === "info") {
        return baseQuery
          .where(({ alert }) =>
            not(or(eq(alert.anomaly_type, "severe"), eq(alert.anomaly_type, "moderate"))),
          )
          .select(toAlertView);
      }

      return baseQuery.select(toAlertView);
    },
    [severity],
  );
}

export function useAlertsOrdered() {
  return useLiveQuery((q) =>
    q
      .from({ alert: alertsCollection })
      .orderBy(({ alert }) => alert.timestamp, "desc")
      .select(toAlertView),
  );
}
