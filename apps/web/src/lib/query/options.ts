/**
 * Centralized queryOptions factories + co-located mutation hooks.
 *
 * All queryFns use the generated OpenAPI SDK via api adapter functions.
 * Mutation hooks call queryClient.invalidateQueries using the shared queryKeys.
 *
 * NOTE: The API client is configured with throwOnError: true at runtime, but
 * the generated SDK types ThrowOnError as false by default. We use a typed
 * unwrap helper so TypeScript is satisfied while runtime throws on error.
 */

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createActionApiV1LookupActionsPost,
  createMachineApiV1LookupMachinesPost,
  createReasonApiV1LookupReasonsPost,
  getActionsApiV1LookupActionsGet,
  getMachinesApiV1LookupMachinesGet,
  getReasonsApiV1LookupReasonsGet,
  listAlertsApiV1AlertsGet,
  updateActionApiV1LookupActionsActionIdPatch,
  updateAlertApiV1AlertsAlertIdPatch,
  updateMachineApiV1LookupMachinesMachineIdPatch,
  updateReasonApiV1LookupReasonsReasonIdPatch,
  type ActionCreateRequest,
  type ActionUpdateRequest,
  type AlertResponse,
  type AlertUpdateRequest,
  type LookupItem,
  type MachineCreateRequest,
  type MachineUpdateRequest,
  type ReasonCreateRequest,
  type ReasonUpdateRequest,
} from "../api-client";
import { getApiClient } from "../api/client";
import { queryKeys } from "./keys";

// The generated client ThrowOnError defaults to false in types, but at runtime
// the client is configured with throwOnError:true, so the resolved value IS the
// unwrapped data (errors throw). This cast bridges the type gap.
function asData<T>(res: unknown): T {
  return res as T;
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export const alertsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.alerts,
    queryFn: async () =>
      asData<AlertResponse[]>(await listAlertsApiV1AlertsGet({ client: getApiClient() })) ?? [],
  });

// ---------------------------------------------------------------------------
// Machines
// ---------------------------------------------------------------------------

export const machinesQueryOptions = (includeInactive = false) =>
  queryOptions({
    queryKey: includeInactive ? queryKeys.machinesWithInactive : queryKeys.machines,
    queryFn: async () =>
      asData<LookupItem[]>(
        await getMachinesApiV1LookupMachinesGet({
          client: getApiClient(),
          query: includeInactive ? { include_inactive: true } : undefined,
        }),
      ) ?? [],
  });

export function useCreateMachineMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MachineCreateRequest) =>
      createMachineApiV1LookupMachinesPost({ client: getApiClient(), body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lookup", "machines"] });
    },
  });
}

export function useUpdateMachineMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ machine_id, body }: { machine_id: number; body: MachineUpdateRequest }) =>
      updateMachineApiV1LookupMachinesMachineIdPatch({
        client: getApiClient(),
        path: { machine_id },
        body,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lookup", "machines"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Reasons
// ---------------------------------------------------------------------------

export const reasonsQueryOptions = (machineId?: number, includeInactive = false) =>
  queryOptions({
    queryKey: includeInactive
      ? queryKeys.reasonsWithInactive(machineId)
      : queryKeys.reasons(machineId),
    queryFn: async () =>
      asData<LookupItem[]>(
        await getReasonsApiV1LookupReasonsGet({
          client: getApiClient(),
          query: {
            ...(machineId != null ? { machine_id: machineId } : {}),
            ...(includeInactive ? { include_inactive: true } : {}),
          },
        }),
      ) ?? [],
  });

export function useCreateReasonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReasonCreateRequest) =>
      createReasonApiV1LookupReasonsPost({ client: getApiClient(), body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lookup", "reasons"] });
    },
  });
}

export function useUpdateReasonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reason_id, body }: { reason_id: number; body: ReasonUpdateRequest }) =>
      updateReasonApiV1LookupReasonsReasonIdPatch({
        client: getApiClient(),
        path: { reason_id },
        body,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lookup", "reasons"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export const actionsQueryOptions = (includeInactive = false) =>
  queryOptions({
    queryKey: includeInactive ? queryKeys.actionsWithInactive : queryKeys.actions,
    queryFn: async () =>
      asData<LookupItem[]>(
        await getActionsApiV1LookupActionsGet({
          client: getApiClient(),
          query: includeInactive ? { include_inactive: true } : undefined,
        }),
      ) ?? [],
  });

export function useCreateActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ActionCreateRequest) =>
      createActionApiV1LookupActionsPost({ client: getApiClient(), body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lookup", "actions"] });
    },
  });
}

export function useUpdateActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action_id, body }: { action_id: number; body: ActionUpdateRequest }) =>
      updateActionApiV1LookupActionsActionIdPatch({
        client: getApiClient(),
        path: { action_id },
        body,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lookup", "actions"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Alert update mutation
// ---------------------------------------------------------------------------

export function useUpdateAlertMutation(alertId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AlertUpdateRequest) =>
      updateAlertApiV1AlertsAlertIdPatch({
        client: getApiClient(),
        path: { alert_id: alertId },
        body,
      }),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts }),
        queryClient.invalidateQueries({ queryKey: queryKeys.alert(alertId) }),
      ]);
    },
  });
}
