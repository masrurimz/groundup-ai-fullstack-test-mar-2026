import { useQuery } from "@tanstack/react-query";
import { env } from "@groundup-ai-fullstack-test-mar-2026/env";

export type AlertTrendPoint = {
  bucket: string;
  count: number;
  machine: string | null;
};

export type MachineHealthSummary = {
  machine_id: string;
  machine_name: string;
  total_alerts: number;
  active_alerts: number;
  critical_count: number;
  warning_count: number;
  last_alert_at: string | null;
};

export type DashboardOverview = {
  total_machines: number;
  active_machines: number;
  total_alerts_24h: number;
  critical_alerts: number;
  warning_alerts: number;
  resolved_rate: number;
};

async function fetchJson<T>(path: string): Promise<T> {
  const base = env.VITE_SERVER_URL.replace(/\/$/, "");
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const dashboardOverviewQueryKey = ["analytics", "overview"] as const;
export const alertTrendsQueryKey = (days: number) => ["analytics", "alert-trends", days] as const;
export const machineHealthQueryKey = ["analytics", "machine-health"] as const;

export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardOverviewQueryKey,
    queryFn: () => fetchJson<DashboardOverview>("/api/v1/analytics/overview"),
    staleTime: 30_000,
  });
}

export function useAlertTrends(days = 30) {
  return useQuery({
    queryKey: alertTrendsQueryKey(days),
    queryFn: () =>
      fetchJson<AlertTrendPoint[]>(`/api/v1/analytics/alert-trends?days=${days}&interval=1+day`),
    staleTime: 60_000,
  });
}

export function useMachineHealth() {
  return useQuery({
    queryKey: machineHealthQueryKey,
    queryFn: () => fetchJson<MachineHealthSummary[]>("/api/v1/analytics/machine-health"),
    staleTime: 30_000,
  });
}
