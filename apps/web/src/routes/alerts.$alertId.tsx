import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PlayCircle, Volume2 } from "lucide-react";

import { useAlertsApi } from "../lib/api/use-alerts-api";

export const Route = createFileRoute("/alerts/$alertId")({
  component: AlertDetailPage,
});

function AlertDetailPage() {
  const navigate = useNavigate();
  const { alertId } = Route.useParams();
  const { alerts, error } = useAlertsApi();

  const selectedAlert = useMemo(() => {
    return alerts.find((alert) => alert.id === alertId);
  }, [alerts, alertId]);

  const machineLabel = selectedAlert?.description?.split(" ")[0] ?? "CNC Machine";

  if (!selectedAlert) {
    return (
      <section className="min-h-0 overflow-y-auto bg-card p-5 lg:p-8">
        <Card className="mx-auto max-w-2xl text-center">
          <CardHeader>
            <CardTitle className="text-xl">Alert Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The selected alert ID does not exist in the current alert dataset.
            </p>
            {error ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                API request failed or timed out.
              </p>
            ) : null}
            <Button className="mt-6" onClick={() => navigate({ to: "/alerts" })}>
              Back To Alerts
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="min-h-0 overflow-y-auto bg-card p-5 lg:p-8">
      <div className="mx-auto max-w-[1400px] pb-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Alert ID #{selectedAlert.id}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Detected at {formatDateTime(selectedAlert.created_at)}
          </p>
        </div>
        <div className="mb-10 h-px bg-border" />

        <div className="mb-12 grid grid-cols-1 gap-16 xl:grid-cols-2">
          <ChartPanel title="Anomaly Machine Output" />
          <ChartPanel title="Normal Machine Output" tonedDown />
        </div>

        <div className="space-y-8 pb-12">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-foreground">Equipment</h4>
            <p className="mt-1 text-sm text-muted-foreground">{machineLabel}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-foreground">
              Comments
            </label>
            <Textarea rows={6} />
          </div>

          <div className="pt-4">
            <Button className="rounded bg-blue-600 px-10 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-700">
              Update
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChartPanel({ title, tonedDown = false }: { title: string; tonedDown?: boolean }) {
  const waveformClip = tonedDown
    ? "polygon(0% 48%, 2% 52%, 4% 45%, 6% 55%, 8% 40%, 10% 60%, 100% 50%, 0% 50%)"
    : "polygon(0% 45%, 5% 40%, 10% 60%, 15% 30%, 20% 70%, 25% 40%, 30% 60%, 35% 20%, 40% 80%, 45% 40%, 50% 60%, 55% 10%, 60% 90%, 65% 30%, 70% 70%, 75% 40%, 80% 60%, 85% 20%, 90% 80%, 95% 40%, 100% 50%)";
  const waveformHeight = tonedDown ? "h-2/5" : "h-3/4";

  return (
    <div>
      <h3 className="mb-6 text-lg font-medium text-foreground">{title}</h3>

      <div className="mb-6 inline-flex w-fit items-center gap-3 rounded-lg bg-muted p-2">
        <button type="button" className="text-foreground hover:text-foreground/80">
          <PlayCircle className="h-5 w-5" />
        </button>
        <span className="font-mono text-[11px] text-muted-foreground">0:09 / 0:35</span>
        <div className="relative h-1 w-24 overflow-hidden rounded-full bg-border">
          <div className="absolute inset-y-0 left-0 w-1/4 bg-foreground" />
        </div>
        <Volume2 className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        {/* Waveform */}
        <div className="relative h-48 border-b border-l border-border">
          <div className="absolute -left-10 bottom-0 top-0 flex flex-col justify-between py-1 text-[10px] font-medium text-muted-foreground">
            <span>AMP</span>
            <span>0.75</span>
            <span>0.50</span>
            <span>0.25</span>
            <span>0.00</span>
            <span>-0.25</span>
            <span>-0.50</span>
            <span>-0.75</span>
          </div>
          <div className="flex h-full w-full items-center overflow-hidden px-1">
            <div
              className={cn("w-full bg-[#3078a6] opacity-90", waveformHeight)}
              style={{ clipPath: waveformClip }}
            />
          </div>
        </div>

        {/* Spectrogram */}
        <div className="relative h-64 border-b border-l border-border">
          <div className="absolute -left-10 bottom-0 top-0 flex flex-col justify-between py-1 text-[10px] font-medium text-muted-foreground">
            <span>8192</span>
            <span>4096</span>
            <span>2048</span>
            <span>1024</span>
            <span>512</span>
            <span>0</span>
          </div>
          <div
            className={cn(
              "h-full w-full overflow-hidden bg-gradient-to-t from-[#240b36] via-[#c31432] to-[#ed8f03]",
              tonedDown ? "opacity-60" : "opacity-80 mix-blend-multiply",
            )}
          >
            <div className="h-full w-full bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] opacity-20 [background-size:2px_2px]" />
            {!tonedDown && (
              <>
                <div className="absolute left-0 right-0 top-[80%] h-2 bg-yellow-400 opacity-40 blur-[1px]" />
                <div className="absolute left-0 right-0 top-[10%] h-1 bg-yellow-300 opacity-30 blur-[1px]" />
              </>
            )}
          </div>
          <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-1 text-[10px] font-medium text-muted-foreground">
            <span>0</span>
            <span>6</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
            <span>30</span>
            <span>36</span>
            <span>42</span>
            <span>48</span>
            <span>54</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-foreground">
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
