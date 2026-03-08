import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActionsApiV1LookupActionsGetOptions,
  getActionsApiV1LookupActionsGetQueryKey,
} from "../api-client/@tanstack/react-query.gen";
import {
  createActionApiV1LookupActionsPost,
  updateActionApiV1LookupActionsActionIdPatch,
} from "../api-client/sdk.gen";
import type { ActionCreateRequest, ActionUpdateRequest } from "../api-client";

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
    mutationFn: async ({ action_id, body }: { action_id: string; body: ActionUpdateRequest }) => {
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
