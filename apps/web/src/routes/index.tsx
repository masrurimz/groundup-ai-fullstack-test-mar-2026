import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import {
  StatsCard,
  RecentAlertsTable,
  AlertTrendChart,
  MachineHealthGrid,
  SystemHealthBanner,
} from "../components/dashboard";
import { AlertCircle, Zap, Activity, CheckCircle, Info } from "lucide-react";
import { useAlertsApi } from "../lib/api/use-alerts-api";
import { useQuery } from "@tanstack/react-query";
import {
  overviewQueryOptions,
  alertTrendsQueryOptions,
  machineHealthQueryOptions,
} from "../lib/query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/")({ component: DashboardComponent });

const RANGE_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
] as const;

const DISMISS_KEY = "dashboard-status-info-dismissed";

function DashboardComponent() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [infoDismissed, setInfoDismissed] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1",
  );

  const { alerts, isLoading: alertsLoading } = useAlertsApi();
  const overviewQuery = useQuery(overviewQueryOptions(days));
  const trendsQuery = useQuery(alertTrendsQueryOptions(days));
  const machineHealthQuery = useQuery(machineHealthQueryOptions(days));

  const overview = overviewQuery.data;

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setInfoDismissed(true);
  }

  const totalResolved = overview
    ? Math.round((overview.resolved_rate / 100) * overview.total_alerts_24h)
    : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Industrial Monitoring Dashboard
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Real-time system health and alert management
            </p>
          </div>
          {/* Page-level time range filter */}
          <div className="flex gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-700">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDays(opt.value)}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  days === opt.value
                    ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dismissible info alert */}
        {!infoDismissed && (
          <Alert className="mb-6 relative">
            <Info className="h-4 w-4" />
            <AlertTitle>How alert status works</AlertTitle>
            <AlertDescription>
              Alerts are marked resolved when both an action and a suspected reason are assigned.
              Unresolved alerts are missing one or both.
            </AlertDescription>
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-sm"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </Alert>
        )}

        {/* System health banner */}
        <SystemHealthBanner overview={overview} isLoading={overviewQuery.isLoading} days={days} />

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
            title={
              <span className="flex items-center gap-1">
                Unresolved Alerts
                <Tooltip>
                  <TooltipTrigger
                    render={<Info className="h-3.5 w-3.5 cursor-help text-slate-400" />}
                  />
                  <TooltipContent>
                    Alerts need both an action and suspected reason to be resolved
                  </TooltipContent>
                </Tooltip>
              </span>
            }
            value={overview?.total_alerts_24h ?? 0}
            icon={<AlertCircle className="h-6 w-6" />}
            description={`${overview?.critical_alerts ?? 0} critical · ${overview?.warning_alerts ?? 0} warning · ${overview?.mild_alerts ?? 0} mild`}
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
            title={
              <span className="flex items-center gap-1">
                Resolution Rate
                <Tooltip>
                  <TooltipTrigger
                    render={<Info className="h-3.5 w-3.5 cursor-help text-slate-400" />}
                  />
                  <TooltipContent>
                    Percentage of alerts with both action and reason assigned
                  </TooltipContent>
                </Tooltip>
              </span>
            }
            value={`${Math.round(overview?.resolved_rate ?? 0)}%`}
            icon={<CheckCircle className="h-6 w-6" />}
            description={`${totalResolved} of ${overview?.total_alerts_24h ?? 0} alerts resolved`}
            variant="default"
          />
        </div>

        {/* Alert trend chart — days controlled from page header */}
        <div className="mb-8">
          <AlertTrendChart data={trendsQuery.data ?? []} isLoading={trendsQuery.isLoading} />
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
