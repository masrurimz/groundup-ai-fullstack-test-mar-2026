import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronDown, PlayCircle, Volume2 } from "lucide-react";
import { useMemo } from "react";

import { createMockAlerts } from "../lib/dashboard-mocks";
import { useAlert, useAlertsOrdered } from "../lib/db";

export const Route = createFileRoute("/alerts/$alertId")({
  component: AlertDetailPage,
});

function AlertDetailPage() {
  const navigate = useNavigate();
  const { alertId } = Route.useParams();
  const { data: liveAlerts } = useAlertsOrdered();
  const { data: selectedAlertFromLiveQuery } = useAlert(alertId);
  const alerts = liveAlerts && liveAlerts.length > 0 ? liveAlerts : createMockAlerts();

  const selectedAlert = useMemo(
    () => selectedAlertFromLiveQuery ?? alerts.find((alert) => alert.id === alertId),
    [selectedAlertFromLiveQuery, alerts, alertId],
  );

  const selectedAlertId = selectedAlert?.id;

  const machineLabel = selectedAlert?.description?.split(" ")[0] ?? "CNC Machine";

  return (
    <main className="grid h-full min-h-0 grid-cols-[320px_1fr] overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <button className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <span>{machineLabel}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {alerts.length} Alerts
          </p>
          <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            2 New
          </span>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {alerts.map((alert) => {
            const active = alert.id === selectedAlertId;
            return (
              <button
                key={alert.id}
                onClick={() => navigate({ to: "/alerts/$alertId", params: { alertId: alert.id } })}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? "border-blue-500 bg-white shadow-sm dark:bg-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${active ? "bg-blue-500" : "border border-slate-300"}`}
                    />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {alert.id}
                    </p>
                  </div>
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    Moderate
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                  {alert.title}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Detected at {formatDateTime(alert.created_at)}
                </p>
                <p className="mt-2 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  {machineLabel}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="min-h-0 overflow-y-auto bg-white p-8 dark:bg-slate-950">
        {!selectedAlert ? (
          <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground">Alert Not Found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The selected alert ID does not exist in the current alert dataset.
            </p>
            <button
              onClick={() => navigate({ to: "/alerts" })}
              className="mt-6 rounded bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
            >
              Back To Alerts
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl pb-10">
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Alert ID {selectedAlert.id}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Detected at {formatDateTime(selectedAlert.created_at)}
            </p>
            <div className="my-8 h-px bg-slate-100 dark:bg-slate-800" />

            <div className="mb-10 grid grid-cols-1 gap-10 xl:grid-cols-2">
              <ChartPanel title="Anomaly Machine Output" />
              <ChartPanel title="Normal Machine Output" tonedDown />
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Equipment
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{machineLabel}</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <SelectField
                  label="Suspected Reason"
                  options={["Unknown Anomaly", "Bearing Failure", "Alignment Issue"]}
                />
                <SelectField
                  label="Action Required"
                  options={[
                    "Select Action",
                    "Scheduled Maintenance",
                    "Emergency Shutdown",
                    "Ignore / False Alarm",
                  ]}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Comments
                </label>
                <textarea
                  rows={5}
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div>
                <button className="rounded bg-blue-600 px-10 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-blue-700">
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function ChartPanel({ title, tonedDown = false }: { title: string; tonedDown?: boolean }) {
  return (
    <div>
      <h3 className="mb-5 text-lg font-medium text-slate-700 dark:text-slate-200">{title}</h3>

      <div className="mb-6 inline-flex items-center gap-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
        <PlayCircle className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
          0:09 / 0:35
        </span>
        <div className="relative h-1 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="absolute inset-y-0 left-0 w-1/4 bg-slate-800 dark:bg-slate-100" />
        </div>
        <Volume2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </div>

      <div className="space-y-4">
        <div className="h-40 rounded border border-slate-200 bg-[linear-gradient(180deg,#eff6ff,#f8fafc)] p-4 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#0f172a,#111827)]">
          <div className="h-full rounded bg-[repeating-linear-gradient(90deg,rgba(37,99,235,0.18),rgba(37,99,235,0.18)_2px,transparent_2px,transparent_4px)]" />
        </div>
        <div className="h-56 rounded border border-slate-200 bg-gradient-to-t from-[#230a35] via-[#b91c1c] to-[#f59e0b] p-4 dark:border-slate-800">
          <div className={`h-full rounded ${tonedDown ? "bg-black/25" : "bg-black/10"}`} />
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <select className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring dark:border-slate-700 dark:bg-slate-900">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString();
}
