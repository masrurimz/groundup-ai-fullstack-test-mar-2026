/**
 * TanStack DB Collections
 * Defines the reactive collections that drive the frontend state
 */

import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { fetchAlerts, type Alert } from "../api/alerts";
import { getQueryClient } from "../query/client";

/**
 * Alerts collection - uses query collection pattern to sync with backend API
 * Provides reactive live queries for alerts data model
 */
export const alertsCollection = createCollection(
  queryCollectionOptions<Alert>({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    queryClient: getQueryClient(),
    getKey: (item) => item.id,
  }),
);
