import { useCallback, useEffect, useState } from "react";

import { fetchAlerts } from "./alerts";
import { toAlertViews, type AlertView } from "./alert-view";

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
  const [alerts, setAlerts] = useState<AlertView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiAlerts = await withTimeout(fetchAlerts(), ALERTS_REQUEST_TIMEOUT_MS);
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
