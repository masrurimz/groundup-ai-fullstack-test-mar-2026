/**
 * Alerts Query Hooks
 * Provides reactive hooks that integrate TanStack DB collections with React
 * All hooks use live queries for reactive updates and proper dependency tracking
 */

import { eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";

import type { Alert } from "../api/alerts";
import { alertsCollection } from "./collections";

/**
 * Fetch all alerts reactively
 */
export function useAlerts() {
  return useLiveQuery((q) =>
    q.from({ alert: alertsCollection }).select(({ alert }) => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      status: alert.status,
      created_at: alert.created_at,
      updated_at: alert.updated_at,
    })),
  );
}

/**
 * Fetch a single alert by ID
 * Returns an array with one item when found, empty when missing.
 */
export function useAlert(id?: string) {
  return useLiveQuery(
    (q) => {
      if (!id) {
        return q
          .from({ alert: alertsCollection })
          .where(({ alert }) => eq(alert.id, "__missing__"))
          .select(({ alert }) => ({
            id: alert.id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            status: alert.status,
            created_at: alert.created_at,
            updated_at: alert.updated_at,
          }));
      }

      return q
        .from({ alert: alertsCollection })
        .where(({ alert }) => eq(alert.id, id))
        .select(({ alert }) => ({
          id: alert.id,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          status: alert.status,
          created_at: alert.created_at,
          updated_at: alert.updated_at,
        }));
    },
    [id],
  );
}

/**
 * Fetch alerts filtered by status
 */
export function useAlertsByStatus(status?: Alert["status"]) {
  return useLiveQuery(
    (q) => {
      if (!status) {
        return q
          .from({ alert: alertsCollection })
          .where(({ alert }) => eq(alert.id, "__missing__"))
          .select(({ alert }) => ({
            id: alert.id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            status: alert.status,
            created_at: alert.created_at,
            updated_at: alert.updated_at,
          }));
      }

      return q
        .from({ alert: alertsCollection })
        .where(({ alert }) => eq(alert.status, status))
        .select(({ alert }) => ({
          id: alert.id,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          status: alert.status,
          created_at: alert.created_at,
          updated_at: alert.updated_at,
        }));
    },
    [status],
  );
}

/**
 * Fetch alerts filtered by severity
 */
export function useAlertsBySeverity(severity?: Alert["severity"]) {
  return useLiveQuery(
    (q) => {
      if (!severity) {
        return q
          .from({ alert: alertsCollection })
          .where(({ alert }) => eq(alert.id, "__missing__"))
          .select(({ alert }) => ({
            id: alert.id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            status: alert.status,
            created_at: alert.created_at,
            updated_at: alert.updated_at,
          }));
      }

      return q
        .from({ alert: alertsCollection })
        .where(({ alert }) => eq(alert.severity, severity))
        .select(({ alert }) => ({
          id: alert.id,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          status: alert.status,
          created_at: alert.created_at,
          updated_at: alert.updated_at,
        }));
    },
    [severity],
  );
}

/**
 * Fetch alerts ordered by creation date (newest first)
 */
export function useAlertsOrdered() {
  return useLiveQuery((q) =>
    q
      .from({ alert: alertsCollection })
      .orderBy(({ alert }) => alert.created_at, "desc")
      .select(({ alert }) => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        status: alert.status,
        created_at: alert.created_at,
        updated_at: alert.updated_at,
      })),
  );
}
