import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchAlerts } from "./alerts";
import { toAlertViews, type AlertView } from "./alert-view";
import { queryKeys } from "../query/keys";

const ALERTS_REQUEST_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Alerts request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

type UseAlertsApiResult = {
  alerts: AlertView[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useAlertsApi(): UseAlertsApiResult {
  const queryClient = useQueryClient();
  const alertsQuery = useQuery({
    queryKey: queryKeys.alerts,
    queryFn: () => withTimeout(fetchAlerts(), ALERTS_REQUEST_TIMEOUT_MS),
  });

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
  }, [queryClient]);

  return {
    alerts: toAlertViews(alertsQuery.data ?? []),
    isLoading: alertsQuery.isLoading,
    error: alertsQuery.error instanceof Error ? alertsQuery.error : null,
    refetch,
  };
}
