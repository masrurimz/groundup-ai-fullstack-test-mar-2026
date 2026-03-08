import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReasonsApiV1LookupReasonsGetOptions,
  getReasonsApiV1LookupReasonsGetQueryKey,
} from "../api-client/@tanstack/react-query.gen";
import {
  createReasonApiV1LookupReasonsPost,
  updateReasonApiV1LookupReasonsReasonIdPatch,
} from "../api-client/sdk.gen";
import type { ReasonCreateRequest, ReasonUpdateRequest } from "../api-client";

export const reasonsQueryOptions = (machineId?: string, includeInactive = false) =>
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
    mutationFn: async ({ reason_id, body }: { reason_id: string; body: ReasonUpdateRequest }) => {
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
