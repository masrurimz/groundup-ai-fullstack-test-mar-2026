import type { MachineHealthSummary } from "@/lib/api/use-dashboard-api";

function statusColor(summary: MachineHealthSummary): string {
  if (summary.critical_count > 0) return "bg-red-500";
  if (summary.warning_count > 0) return "bg-amber-400";
  return "bg-green-500";
}

function activeBadgeColor(activeAlerts: number): string {
  if (activeAlerts === 0)
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (activeAlerts > 3) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
}

interface MachineHealthGridProps {
  data: MachineHealthSummary[];
  isLoading: boolean;
}

export function MachineHealthGrid({ data, isLoading }: MachineHealthGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">No machines configured</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {data.map((machine) => (
        <div
          key={machine.machine_id}
          className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${statusColor(machine)}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                {machine.machine_name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {machine.total_alerts} total
              </p>
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${activeBadgeColor(machine.active_alerts)}`}
            >
              {machine.active_alerts} active
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
