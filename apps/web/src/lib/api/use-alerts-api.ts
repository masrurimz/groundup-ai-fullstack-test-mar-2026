import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { listAlertsApiV1AlertsGetOptions } from "../api-client/@tanstack/react-query.gen";
import { toAlertViews, type AlertView } from "./alert-view";

type UseAlertsApiResult = {
  alerts: AlertView[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useAlertsApi(): UseAlertsApiResult {
  const queryClient = useQueryClient();
  const queryOptions = listAlertsApiV1AlertsGetOptions();
  const alertsQuery = useQuery({
    ...queryOptions,
    select: (data) => toAlertViews(data ?? []),
  });

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
  }, [queryClient, queryOptions.queryKey]);

  return {
    alerts: alertsQuery.data ?? [],
    isLoading: alertsQuery.isLoading,
    error: alertsQuery.error instanceof Error ? alertsQuery.error : null,
    refetch,
  };
}
