import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMachinesApiV1LookupMachinesGetOptions,
  getMachinesApiV1LookupMachinesGetQueryKey,
} from "../api-client/@tanstack/react-query.gen";
import {
  createMachineApiV1LookupMachinesPost,
  updateMachineApiV1LookupMachinesMachineIdPatch,
} from "../api-client/sdk.gen";
import type { MachineCreateRequest, MachineUpdateRequest } from "../api-client";
import { overviewQueryKey, machineHealthQueryKey } from "./analytics";

export const machinesQueryOptions = (includeInactive = false) =>
  getMachinesApiV1LookupMachinesGetOptions({
    query: includeInactive ? { include_inactive: true } : undefined,
  });

export function useCreateMachineMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: MachineCreateRequest) => {
      const { data } = await createMachineApiV1LookupMachinesPost({
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: getMachinesApiV1LookupMachinesGetQueryKey() }),
        queryClient.invalidateQueries({ queryKey: overviewQueryKey() }),
        queryClient.invalidateQueries({ queryKey: machineHealthQueryKey() }),
      ]);
    },
  });
}

export function useUpdateMachineMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      machine_id,
      body,
    }: {
      machine_id: string;
      body: MachineUpdateRequest;
    }) => {
      const { data } = await updateMachineApiV1LookupMachinesMachineIdPatch({
        path: { machine_id },
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: getMachinesApiV1LookupMachinesGetQueryKey() }),
        queryClient.invalidateQueries({ queryKey: overviewQueryKey() }),
        queryClient.invalidateQueries({ queryKey: machineHealthQueryKey() }),
      ]);
    },
  });
}
