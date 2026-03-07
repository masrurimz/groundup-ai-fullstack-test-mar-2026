import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { StatsCard, MachineBreakdownChart, RecentAlertsTable } from "../components/dashboard";
import { AlertCircle, Zap, Activity, TrendingUp } from "lucide-react";
import { useAlertsApi } from "../lib/api/use-alerts-api";

export const Route = createFileRoute("/")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const navigate = useNavigate();
  const { alerts, isLoading, error } = useAlertsApi();

  const loading = isLoading;

  const machineStats = useMemo(() => {
    const byMachine = new Map<
      string,
      { warningCount: number; criticalCount: number; alertCount: number }
    >();

    for (const alert of alerts) {
      const machine = byMachine.get(alert.machine) ?? {
        warningCount: 0,
        criticalCount: 0,
        alertCount: 0,
      };
      machine.alertCount += 1;
      if (alert.severity === "critical") {
        machine.criticalCount += 1;
      } else if (alert.severity === "warning") {
        machine.warningCount += 1;
      }
      byMachine.set(alert.machine, machine);
    }

    return [...byMachine.entries()].map(([name, machine]) => {
      const status: "healthy" | "warning" | "critical" =
        machine.criticalCount > 0 ? "critical" : machine.warningCount > 0 ? "warning" : "healthy";
      const uptime = Math.max(80, 100 - machine.alertCount * 2);

      return {
        name,
        status,
        uptime,
        alertCount: machine.alertCount,
      };
    });
  }, [alerts]);

  const stats = useMemo(() => {
    const healthyMachines = machineStats.filter((machine) => machine.status === "healthy").length;
    const criticalMachines = machineStats.filter((machine) => machine.status === "critical").length;
    const activeAlerts = alerts.filter((alert) => alert.status === "active").length;
    const averageUptime =
      machineStats.length > 0
        ? Math.round(
            machineStats.reduce((total, machine) => total + machine.uptime, 0) /
              machineStats.length,
          )
        : 0;

    return {
      totalMachines: machineStats.length,
      healthyMachines,
      criticalMachines,
      activeAlerts,
      averageUptime,
    };
  }, [machineStats, alerts]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Industrial Monitoring Dashboard
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Real-time system health and alert management
          </p>
          {error ? (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
              Unable to load alerts from API. Showing empty state.
            </p>
          ) : null}
        </div>

        {/* Key statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Machines"
            value={stats.totalMachines}
            icon={<Zap className="h-6 w-6" />}
            description={`${stats.healthyMachines} healthy`}
            variant={stats.criticalMachines > 0 ? "critical" : "default"}
          />
          <StatsCard
            title="Average Uptime"
            value={`${stats.averageUptime}%`}
            icon={<Activity className="h-6 w-6" />}
            description="Across all machines"
            trend={{
              direction: stats.averageUptime >= 99 ? "up" : "down",
              percentage: Math.abs(stats.averageUptime - 99),
            }}
          />
          <StatsCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={<AlertCircle className="h-6 w-6" />}
            variant={stats.activeAlerts > 3 ? "warning" : "default"}
            description="Requiring attention"
          />
          <StatsCard
            title="Critical Issues"
            value={stats.criticalMachines}
            icon={<TrendingUp className="h-6 w-6" />}
            variant={stats.criticalMachines > 0 ? "critical" : "default"}
            description="Immediate action needed"
          />
        </div>

        {/* Machine breakdown and recent alerts */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Machine Status Breakdown */}
          <div className="lg:col-span-1">
            <MachineBreakdownChart data={machineStats} isLoading={loading} />
          </div>

          {/* Recent Alerts */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
              Recent Alerts
            </h2>
            <RecentAlertsTable
              alerts={alerts}
              isLoading={loading}
              onAlertClick={(id) => {
                void navigate({ to: "/alerts/$alertId", params: { alertId: id } });
              }}
            />
          </div>
        </div>

        {/* Integration notes */}
        <div className="mt-12 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            📝 Integration Points:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <li>• Machine stats: Derived from live alert telemetry grouped by machine</li>
            <li>• Alerts list: Driven by API-backed alert query hooks</li>
            <li>• Alerts navigation: Clicking a row opens the detail workspace route</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
