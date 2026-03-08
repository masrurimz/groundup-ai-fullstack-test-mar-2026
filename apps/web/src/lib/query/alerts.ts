import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAlertApiV1AlertsAlertIdGetQueryKey,
  listAlertsApiV1AlertsGetOptions,
  listAlertsApiV1AlertsGetQueryKey,
} from "../api-client/@tanstack/react-query.gen";
import { updateAlertApiV1AlertsAlertIdPatch } from "../api-client/sdk.gen";
import type { AlertUpdateRequest } from "../api-client";
import { overviewQueryKey, alertTrendsQueryKey, machineHealthQueryKey } from "./analytics";

export const alertsQueryOptions = () => listAlertsApiV1AlertsGetOptions();

export function useUpdateAlertMutation(alertId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: AlertUpdateRequest) => {
      const { data } = await updateAlertApiV1AlertsAlertIdPatch({
        path: { alert_id: alertId },
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: listAlertsApiV1AlertsGetQueryKey() }),
        queryClient.invalidateQueries({
          queryKey: getAlertApiV1AlertsAlertIdGetQueryKey({ path: { alert_id: alertId } }),
        }),
        queryClient.invalidateQueries({ queryKey: overviewQueryKey() }),
        queryClient.invalidateQueries({ queryKey: alertTrendsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: machineHealthQueryKey() }),
      ]);
    },
  });
}
