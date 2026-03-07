import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StatsCard, MachineBreakdownChart, RecentAlertsTable } from "../components/dashboard";
import { fetchAlerts, type Alert } from "../lib/api";
import {
  createMockMachineStats,
  createMockAlerts,
  computeDashboardStats,
} from "../lib/dashboard-mocks";
import { AlertCircle, Zap, Activity, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load alerts on mount (use real data if available, fall back to mocks)
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAlerts();
        setAlerts(data);
      } catch (err) {
        // Fallback to mock data if API fails
        console.warn("Failed to fetch alerts, using mock data:", err);
        setAlerts(createMockAlerts());
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

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

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

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
            <li>
              • Machine stats: Using typed mocks (awaiting TanStack DB collections from
              groundup-ai-7gw)
            </li>
            <li>• Alert styling: Will respect theme tokens from groundup-ai-di8</li>
            <li>
              • Real-time updates: Will use TanStack Query subscriptions once upstream tasks
              complete
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
