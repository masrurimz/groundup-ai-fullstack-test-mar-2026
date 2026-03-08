import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSensorsApiV1LookupSensorsGetOptions,
  getSensorsApiV1LookupSensorsGetQueryKey,
} from "../api-client/@tanstack/react-query.gen";
import {
  createSensorApiV1LookupSensorsPost,
  updateSensorApiV1LookupSensorsSensorIdPatch,
} from "../api-client/sdk.gen";
import type { SensorCreateRequest, SensorUpdateRequest } from "../api-client";

export const sensorsQueryOptions = (machineId?: string, includeInactive = false) =>
  getSensorsApiV1LookupSensorsGetOptions({
    query: {
      ...(machineId != null ? { machine_id: machineId } : {}),
      ...(includeInactive ? { include_inactive: true } : {}),
    },
  });

export function useCreateSensorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: SensorCreateRequest) => {
      const { data } = await createSensorApiV1LookupSensorsPost({
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getSensorsApiV1LookupSensorsGetQueryKey(),
      });
    },
  });
}

export function useUpdateSensorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sensor_id, body }: { sensor_id: string; body: SensorUpdateRequest }) => {
      const { data } = await updateSensorApiV1LookupSensorsSensorIdPatch({
        path: { sensor_id },
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getSensorsApiV1LookupSensorsGetQueryKey(),
      });
    },
  });
}
