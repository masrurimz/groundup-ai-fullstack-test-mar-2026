import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import {
  StatsCard,
  RecentAlertsTable,
  AlertTrendChart,
  MachineHealthGrid,
  SystemHealthBanner,
} from "../components/dashboard";
import { AlertCircle, Zap, Activity, CheckCircle } from "lucide-react";
import { useAlertsApi } from "../lib/api/use-alerts-api";
import { useQuery } from "@tanstack/react-query";
import {
  overviewQueryOptions,
  alertTrendsQueryOptions,
  machineHealthQueryOptions,
} from "../lib/query";

export const Route = createFileRoute("/")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);

  const { alerts, isLoading: alertsLoading } = useAlertsApi();
  const overviewQuery = useQuery(overviewQueryOptions());
  const trendsQuery = useQuery(alertTrendsQueryOptions(days));
  const machineHealthQuery = useQuery(machineHealthQueryOptions());

  const overview = overviewQuery.data;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Industrial Monitoring Dashboard
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Real-time system health and alert management
          </p>
        </div>

        {/* System health banner */}
        <SystemHealthBanner overview={overview} isLoading={overviewQuery.isLoading} />

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Machines"
            value={overview?.total_machines ?? 0}
            icon={<Zap className="h-6 w-6" />}
            description={`${overview?.active_machines ?? 0} active`}
            variant="default"
          />
          <StatsCard
            title="Active Alerts 24h"
            value={overview?.total_alerts_24h ?? 0}
            icon={<AlertCircle className="h-6 w-6" />}
            description="In the last 24 hours"
            variant={(overview?.total_alerts_24h ?? 0) > 10 ? "warning" : "default"}
          />
          <StatsCard
            title="Critical Issues"
            value={overview?.critical_alerts ?? 0}
            icon={<Activity className="h-6 w-6" />}
            description="Immediate action needed"
            variant={(overview?.critical_alerts ?? 0) > 0 ? "critical" : "default"}
          />
          <StatsCard
            title="Resolution Rate"
            value={`${Math.round(overview?.resolved_rate ?? 0)}%`}
            icon={<CheckCircle className="h-6 w-6" />}
            description={`${overview?.warning_alerts ?? 0} warnings active`}
            variant="default"
          />
        </div>

        {/* Alert trend chart */}
        <div className="mb-8">
          <AlertTrendChart
            data={trendsQuery.data ?? []}
            isLoading={trendsQuery.isLoading}
            days={days}
            onDaysChange={setDays}
          />
        </div>

        {/* Machine health + recent alerts */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
              Machine Health
            </h2>
            <MachineHealthGrid
              data={machineHealthQuery.data ?? []}
              isLoading={machineHealthQuery.isLoading}
            />
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
              Recent Alerts
            </h2>
            <RecentAlertsTable
              alerts={alerts}
              isLoading={alertsLoading}
              onAlertClick={(id) => {
                void navigate({
                  to: "/alerts/$alertId",
                  params: { alertId: id },
                  search: { machine: undefined },
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
