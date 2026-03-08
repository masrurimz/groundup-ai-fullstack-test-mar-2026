/**
 * TanStack DB Collections
 * Defines the reactive collections that drive the frontend state
 */

import "../runtime/ensure-crypto-random-uuid";
import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

import { listAlertsApiV1AlertsGet, type AlertResponse } from "../api-client";
import { getQueryClient } from "../query/client";

export type Alert = AlertResponse;

/**
 * Alerts collection - uses query collection pattern to sync with backend API
 * Provides reactive live queries for alerts data model
 */
export const alertsCollection = createCollection(
  queryCollectionOptions<Alert>({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data } = await listAlertsApiV1AlertsGet({ throwOnError: true });
      return data ?? [];
    },
    queryClient: getQueryClient(),
    getKey: (item) => item.id,
  }),
);
