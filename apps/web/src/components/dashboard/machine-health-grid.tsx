import type { MachineHealthSummary } from "@/lib/api-client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full cursor-help ${statusColor(machine)}`}
                  />
                }
              />
              <TooltipContent>
                {machine.critical_count > 0
                  ? "Worst severity: Severe"
                  : machine.warning_count > 0
                    ? "Worst severity: Moderate"
                    : "Normal — no severe/moderate alerts"}
              </TooltipContent>
            </Tooltip>
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
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-help ${activeBadgeColor(machine.active_alerts)}`}
                  >
                    {machine.active_alerts} unresolved
                  </span>
                }
              />
              <TooltipContent>Alerts missing an action or suspected reason</TooltipContent>
            </Tooltip>
            {machine.total_alerts > 0 &&
              (() => {
                const mildCount =
                  machine.total_alerts - machine.critical_count - machine.warning_count;
                const p = (n: number) => Math.round((n / machine.total_alerts) * 100);
                return (
                  <>
                    <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      {machine.critical_count > 0 && (
                        <div
                          className="bg-red-500"
                          style={{ width: `${p(machine.critical_count)}%` }}
                        />
                      )}
                      {machine.warning_count > 0 && (
                        <div
                          className="bg-amber-400"
                          style={{ width: `${p(machine.warning_count)}%` }}
                        />
                      )}
                      {mildCount > 0 && (
                        <div className="bg-blue-400" style={{ width: `${p(mildCount)}%` }} />
                      )}
                    </div>
                    {/* Severity legend */}
                    <div className="mt-1 flex gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      {machine.critical_count > 0 && (
                        <span className="flex items-center gap-0.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                          {machine.critical_count} severe
                        </span>
                      )}
                      {machine.warning_count > 0 && (
                        <span className="flex items-center gap-0.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                          {machine.warning_count} moderate
                        </span>
                      )}
                      {machine.total_alerts - machine.critical_count - machine.warning_count >
                        0 && (
                        <span className="flex items-center gap-0.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                          {machine.total_alerts -
                            machine.critical_count -
                            machine.warning_count}{" "}
                          mild
                        </span>
                      )}
                    </div>
                  </>
                );
              })()}
          </div>
        </div>
      ))}
    </div>
  );
}
