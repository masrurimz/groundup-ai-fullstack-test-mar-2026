import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatsCard, MachineBreakdownChart, RecentAlertsTable } from "../components/dashboard";
import {
  createMockMachineStats,
  createMockAlerts,
  computeDashboardStats,
} from "../lib/dashboard-mocks";
import { AlertCircle, Zap, Activity, TrendingUp } from "lucide-react";
import { useAlertsOrdered } from "../lib/db";

export const Route = createFileRoute("/")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const navigate = useNavigate();
  const { data: liveAlerts, isLoading } = useAlertsOrdered();

  const alerts = liveAlerts && liveAlerts.length > 0 ? liveAlerts : createMockAlerts();
  const loading = isLoading && !liveAlerts;

  // Use mock machine stats (TODO: Replace with TanStack DB collection when 7gw is ready)
  const machineStats = createMockMachineStats();
  const stats = computeDashboardStats(machineStats, alerts);

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
            <li>• Machine stats: Using typed mocks pending machine collection implementation</li>
            <li>• Alerts list: Driven by TanStack DB reactive query hooks</li>
            <li>• Alerts navigation: Clicking a row opens the detail workspace route</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
