import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlayCircle, Volume2 } from "lucide-react";
import { useMemo } from "react";

import { AlertsSidebar } from "@/components/alerts/alerts-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { useAlert, useAlertsOrdered } from "../lib/db";

export const Route = createFileRoute("/alerts/$alertId")({
  component: AlertDetailPage,
});

function AlertDetailPage() {
  const navigate = useNavigate();
  const { alertId } = Route.useParams();

  const { data: liveAlerts } = useAlertsOrdered();
  const { data: selectedAlertFromLiveQuery } = useAlert(alertId);

  const alerts = liveAlerts ?? [];
  const selectedAlert = useMemo(() => {
    const liveQueryResult = Array.isArray(selectedAlertFromLiveQuery)
      ? selectedAlertFromLiveQuery[0]
      : selectedAlertFromLiveQuery;

    return liveQueryResult ?? alerts.find((alert) => alert.id === alertId);
  }, [selectedAlertFromLiveQuery, alerts, alertId]);

  const machineLabel = selectedAlert?.description?.split(" ")[0] ?? "CNC Machine";

  return (
    <main className="grid h-full min-h-0 grid-cols-1 overflow-hidden bg-background lg:grid-cols-[320px_1fr]">
      <AlertsSidebar
        alerts={alerts}
        selectedAlertId={selectedAlert?.id}
        machineLabel={machineLabel}
        onBack={() => navigate({ to: "/" })}
        onSelectAlert={(id) => navigate({ to: "/alerts/$alertId", params: { alertId: id } })}
      />

      <section className="min-h-0 overflow-y-auto bg-card p-5 lg:p-8">
        {!selectedAlert ? (
          <Card className="mx-auto max-w-2xl text-center">
            <CardHeader>
              <CardTitle className="text-xl">Alert Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The selected alert ID does not exist in the current alert dataset.
              </p>
              <Button className="mt-6" onClick={() => navigate({ to: "/alerts" })}>
                Back To Alerts
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mx-auto max-w-6xl pb-10">
            <h1 className="text-2xl font-semibold text-foreground">Alert ID {selectedAlert.id}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Detected at {formatDateTime(selectedAlert.created_at)}
            </p>
            <Separator className="my-8" />

            <div className="mb-10 grid grid-cols-1 gap-10 xl:grid-cols-2">
              <ChartPanel title="Anomaly Machine Output" />
              <ChartPanel title="Normal Machine Output" tonedDown />
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Equipment
                </p>
                <p className="mt-1 text-sm text-foreground">{machineLabel}</p>
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
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Comments
                </label>
                <Textarea rows={5} />
              </div>

              <div>
                <Button className="rounded px-10 py-2.5 text-xs font-bold uppercase tracking-widest">
                  Update
                </Button>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 inline-flex items-center gap-3 rounded-lg bg-muted p-2">
          <Button variant="ghost" size="icon-sm">
            <PlayCircle className="h-5 w-5" />
          </Button>
          <span className="font-mono text-[11px] text-muted-foreground">0:09 / 0:35</span>
          <div className="relative h-1 w-24 overflow-hidden rounded-full bg-border">
            <div className="absolute inset-y-0 left-0 w-1/4 bg-foreground" />
          </div>
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="space-y-4">
          <div className="h-40 rounded border border-border bg-[linear-gradient(180deg,#eff6ff,#f8fafc)] p-4 dark:bg-[linear-gradient(180deg,#0f172a,#111827)]">
            <div className="h-full rounded bg-[repeating-linear-gradient(90deg,rgba(37,99,235,0.18),rgba(37,99,235,0.18)_2px,transparent_2px,transparent_4px)]" />
          </div>
          <div className="h-56 rounded border border-border bg-gradient-to-t from-[#230a35] via-[#b91c1c] to-[#f59e0b] p-4">
            <div className={cn("h-full rounded", tonedDown ? "bg-black/25" : "bg-black/10")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <Select>
        <SelectTrigger className="w-full rounded-md">
          <SelectValue placeholder={options[0]} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString();
}
