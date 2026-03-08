/**
 * Centralized queryOptions factories + co-located mutation hooks.
 *
 * Delegates to the generated TanStack Query helpers from @hey-api/openapi-ts.
 * Mutation hooks use the generated SDK functions directly with custom
 * onSuccess invalidation logic using generated query keys.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getActionsApiV1LookupActionsGetOptions,
  getActionsApiV1LookupActionsGetQueryKey,
  getAlertApiV1AlertsAlertIdGetQueryKey,
  getMachinesApiV1LookupMachinesGetOptions,
  getMachinesApiV1LookupMachinesGetQueryKey,
  getReasonsApiV1LookupReasonsGetOptions,
  getReasonsApiV1LookupReasonsGetQueryKey,
  listAlertsApiV1AlertsGetOptions,
  listAlertsApiV1AlertsGetQueryKey,
} from "../api-client/@tanstack/react-query.gen";
import {
  createActionApiV1LookupActionsPost,
  createMachineApiV1LookupMachinesPost,
  createReasonApiV1LookupReasonsPost,
  updateActionApiV1LookupActionsActionIdPatch,
  updateAlertApiV1AlertsAlertIdPatch,
  updateMachineApiV1LookupMachinesMachineIdPatch,
  updateReasonApiV1LookupReasonsReasonIdPatch,
} from "../api-client/sdk.gen";
import type {
  ActionCreateRequest,
  ActionUpdateRequest,
  AlertUpdateRequest,
  MachineCreateRequest,
  MachineUpdateRequest,
  ReasonCreateRequest,
  ReasonUpdateRequest,
} from "../api-client";

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export const alertsQueryOptions = () => listAlertsApiV1AlertsGetOptions();

// ---------------------------------------------------------------------------
// Machines
// ---------------------------------------------------------------------------

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
      void queryClient.invalidateQueries({
        queryKey: getMachinesApiV1LookupMachinesGetQueryKey(),
      });
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
      machine_id: number;
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
      void queryClient.invalidateQueries({
        queryKey: getMachinesApiV1LookupMachinesGetQueryKey(),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Reasons
// ---------------------------------------------------------------------------

export const reasonsQueryOptions = (machineId?: number, includeInactive = false) =>
  getReasonsApiV1LookupReasonsGetOptions({
    query: {
      ...(machineId != null ? { machine_id: machineId } : {}),
      ...(includeInactive ? { include_inactive: true } : {}),
    },
  });

export function useCreateReasonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ReasonCreateRequest) => {
      const { data } = await createReasonApiV1LookupReasonsPost({
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getReasonsApiV1LookupReasonsGetQueryKey(),
      });
    },
  });
}

export function useUpdateReasonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reason_id, body }: { reason_id: number; body: ReasonUpdateRequest }) => {
      const { data } = await updateReasonApiV1LookupReasonsReasonIdPatch({
        path: { reason_id },
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getReasonsApiV1LookupReasonsGetQueryKey(),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export const actionsQueryOptions = (includeInactive = false) =>
  getActionsApiV1LookupActionsGetOptions({
    query: includeInactive ? { include_inactive: true } : undefined,
  });

export function useCreateActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ActionCreateRequest) => {
      const { data } = await createActionApiV1LookupActionsPost({
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getActionsApiV1LookupActionsGetQueryKey(),
      });
    },
  });
}

export function useUpdateActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ action_id, body }: { action_id: number; body: ActionUpdateRequest }) => {
      const { data } = await updateActionApiV1LookupActionsActionIdPatch({
        path: { action_id },
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getActionsApiV1LookupActionsGetQueryKey(),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Alert update mutation
// ---------------------------------------------------------------------------

export function useUpdateAlertMutation(alertId: number) {
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
        queryClient.invalidateQueries({
          queryKey: listAlertsApiV1AlertsGetQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getAlertApiV1AlertsAlertIdGetQueryKey({
            path: { alert_id: alertId },
          }),
        }),
      ]);
    },
  });
}
