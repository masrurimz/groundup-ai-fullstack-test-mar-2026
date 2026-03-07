import { useCallback, useEffect, useState } from "react";

import { fetchAlerts } from "./alerts";
import { toAlertViews, type AlertView } from "./alert-view";

type UseAlertsApiResult = {
  alerts: AlertView[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useAlertsApi(): UseAlertsApiResult {
  const [alerts, setAlerts] = useState<AlertView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiAlerts = await fetchAlerts();
      setAlerts(toAlertViews(apiAlerts));
    } catch (unknownError) {
      setAlerts([]);
      setError(
        unknownError instanceof Error ? unknownError : new Error("Failed to load alerts from API"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    alerts,
    isLoading,
    error,
    refetch,
  };
}
