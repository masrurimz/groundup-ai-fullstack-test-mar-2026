/**
 * Alerts Query Hooks
 * Provides reactive hooks that integrate TanStack DB collections with React.
 */

import { eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";

import type { Alert } from "../api/alerts";
import { alertsCollection } from "./collections";

const selectAlertFields = ({ alert }: { alert: Alert }) => ({
  id: alert.id,
  title: alert.title,
  description: alert.description,
  severity: alert.severity,
  status: alert.status,
  created_at: alert.created_at,
  updated_at: alert.updated_at,
});

/**
 * Fetch all alerts reactively.
 */
export function useAlerts() {
  return useLiveQuery((q) =>
    q
      .from({ alert: alertsCollection })
      .orderBy(({ alert }) => alert.created_at, "desc")
      .select(selectAlertFields),
  );
}

/**
 * Fetch a single alert by ID.
 */
export function useAlert(id?: string) {
  return useLiveQuery(
    (q) => {
      if (!id) {
        return null;
      }

      return q
        .from({ alert: alertsCollection })
        .where(({ alert }) => eq(alert.id, id))
        .select(selectAlertFields)
        .findOne();
    },
    [id],
  );
}

/**
 * Fetch alerts filtered by status.
 * If no status is provided, returns all alerts.
 */
export function useAlertsByStatus(status?: Alert["status"]) {
  return useLiveQuery(
    (q) => {
      const baseQuery = q.from({ alert: alertsCollection });

      if (!status) {
        return baseQuery.orderBy(({ alert }) => alert.created_at, "desc").select(selectAlertFields);
      }

      return baseQuery
        .where(({ alert }) => eq(alert.status, status))
        .orderBy(({ alert }) => alert.created_at, "desc")
        .select(selectAlertFields);
    },
    [status],
  );
}

/**
 * Fetch alerts filtered by severity.
 * If no severity is provided, returns all alerts.
 */
export function useAlertsBySeverity(severity?: Alert["severity"]) {
  return useLiveQuery(
    (q) => {
      const baseQuery = q.from({ alert: alertsCollection });

      if (!severity) {
        return baseQuery.orderBy(({ alert }) => alert.created_at, "desc").select(selectAlertFields);
      }

      return baseQuery
        .where(({ alert }) => eq(alert.severity, severity))
        .orderBy(({ alert }) => alert.created_at, "desc")
        .select(selectAlertFields);
    },
    [severity],
  );
}

/**
 * Fetch alerts ordered by creation date (newest first).
 */
export function useAlertsOrdered() {
  return useLiveQuery((q) =>
    q
      .from({ alert: alertsCollection })
      .orderBy(({ alert }) => alert.created_at, "desc")
      .select(selectAlertFields),
  );
}
