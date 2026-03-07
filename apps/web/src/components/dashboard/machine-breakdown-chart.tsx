import { useMemo } from "react";

export interface MachineStats {
  name: string;
  status: "healthy" | "warning" | "critical";
  uptime: number;
  alertCount: number;
}

export interface MachineBreakdownChartProps {
  data: MachineStats[];
  isLoading?: boolean;
}

export function MachineBreakdownChart({ data, isLoading = false }: MachineBreakdownChartProps) {
  const statusCounts = useMemo(() => {
    return {
      healthy: data.filter((m) => m.status === "healthy").length,
      warning: data.filter((m) => m.status === "warning").length,
      critical: data.filter((m) => m.status === "critical").length,
    };
  }, [data]);

  const statusColors = {
    healthy: "bg-green-500 dark:bg-green-600",
    warning: "bg-yellow-500 dark:bg-yellow-600",
    critical: "bg-red-500 dark:bg-red-600",
  };

  const statusLabels = {
    healthy: "Healthy",
    warning: "Warning",
    critical: "Critical",
  };

  const total = data.length || 1;
  const percentages = {
    healthy: Math.round((statusCounts.healthy / total) * 100),
    warning: Math.round((statusCounts.warning / total) * 100),
    critical: Math.round((statusCounts.critical / total) * 100),
  };

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-50">
        Machine Status Breakdown ({total} total)
      </h3>

      {/* Status bars */}
      <div className="mb-6 space-y-3">
        {(["healthy", "warning", "critical"] as const).map((status) => (
          <div key={status}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {statusLabels[status]}
              </label>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {statusCounts[status]} ({percentages[status]}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full ${statusColors[status]} transition-all`}
                style={{ width: `${percentages[status]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {data.length > 0 && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <p>
            {statusCounts.critical === 0
              ? "No critical alerts"
              : `${statusCounts.critical} machine${
                  statusCounts.critical > 1 ? "s" : ""
                } in critical state`}
          </p>
        </div>
      )}
    </div>
  );
}
