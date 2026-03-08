import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { client } from "@/lib/api-client/client.gen";
import {
  getMachinesApiV1LookupMachinesGetQueryKey,
  getAlertApiV1AlertsAlertIdGetQueryKey,
  listAlertsApiV1AlertsGetQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen";
import {
  useCreateMachineMutation,
  useUpdateMachineMutation,
  useUpdateAlertMutation,
} from "@/lib/query/options";

beforeAll(() => {
  client.setConfig({ baseUrl: "http://localhost:8000" });
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, Wrapper };
}

describe("useCreateMachineMutation", () => {
  it("resolves with the created machine and invalidates machines query", async () => {
    const { queryClient, Wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateMachineMutation(), {
      wrapper: Wrapper,
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync({ name: "New Machine" });
    });

    expect(resolved).toMatchObject({
      id: "m2",
      name: "New Machine",
      is_active: true,
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: getMachinesApiV1LookupMachinesGetQueryKey(),
        }),
      );
    });
  });
});

describe("useUpdateMachineMutation", () => {
  it("resolves with the updated machine and invalidates machines query", async () => {
    const { queryClient, Wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateMachineMutation(), {
      wrapper: Wrapper,
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync({
        machine_id: "m1",
        body: { is_active: false },
      });
    });

    expect(resolved).toMatchObject({
      id: "m1",
      is_active: false,
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: getMachinesApiV1LookupMachinesGetQueryKey(),
        }),
      );
    });
  });
});

describe("useUpdateAlertMutation", () => {
  it("resolves with updated alert and invalidates both alert query keys", async () => {
    const { queryClient, Wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateAlertMutation("a1"), {
      wrapper: Wrapper,
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync({ comment: "ok" });
    });

    expect(resolved).toMatchObject({
      id: "a1",
      comment: "ok",
      suspected_reason: "Spindle Error",
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: listAlertsApiV1AlertsGetQueryKey(),
        }),
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: getAlertApiV1AlertsAlertIdGetQueryKey({
            path: { alert_id: "a1" },
          }),
        }),
      );
    });
  });
});
