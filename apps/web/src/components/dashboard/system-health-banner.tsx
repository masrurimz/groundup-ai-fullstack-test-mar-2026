import type { DashboardOverview } from "@/lib/api-client";

interface SystemHealthBannerProps {
  overview: DashboardOverview | undefined;
  isLoading: boolean;
  days: number;
}

export function SystemHealthBanner({ overview, isLoading, days }: SystemHealthBannerProps) {
  if (isLoading) {
    return <div className="mb-6 h-12 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />;
  }

  const isHealthy = !overview || overview.critical_alerts === 0;

  return (
    <div
      className={`mb-6 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 ${
        isHealthy
          ? "border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/20"
          : "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${isHealthy ? "bg-green-500" : "bg-amber-500"}`}
        />
        <span
          className={`text-sm font-semibold ${
            isHealthy ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300"
          }`}
        >
          {isHealthy ? "All Systems Operational" : "System Degraded"} · Last {days}d
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip label="Machines" value={overview?.total_machines ?? 0} />
        <Chip label="Active" value={overview?.active_machines ?? 0} />
        <Chip label="Critical" value={overview?.critical_alerts ?? 0} />
        <Chip label="Warnings" value={overview?.warning_alerts ?? 0} />
        <Chip label="Resolved" value={`${Math.round(overview?.resolved_rate ?? 0)}%`} />
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
      {label}: <span className="font-medium text-slate-900 dark:text-slate-50">{value}</span>
    </span>
  );
}
