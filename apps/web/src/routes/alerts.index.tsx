import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

import { useAlertsApi } from "../lib/api/use-alerts-api";

export const Route = createFileRoute("/alerts/")({
  component: AlertsIndexPage,
});

function AlertsIndexPage() {
  const navigate = useNavigate();
  const { alerts, isLoading, error } = useAlertsApi();
  const firstAlert = alerts[0];

  useEffect(() => {
    if (firstAlert) {
      void navigate({
        to: "/alerts/$alertId",
        params: { alertId: firstAlert.id },
        replace: true,
      });
    }
  }, [firstAlert, navigate]);

  if (isLoading || firstAlert) {
    return (
      <section className="grid h-full place-items-center bg-card">
        <p className="text-sm text-muted-foreground">Loading alerts workspace...</p>
      </section>
    );
  }

  return (
    <section className="grid h-full place-items-center bg-card px-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">No Alerts Available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Alerts will appear here once data is available from the monitoring pipeline.
        </p>
        {error ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            API request failed or timed out.
          </p>
        ) : null}
        <div className="mt-6">
          <Button onClick={() => void navigate({ to: "/" })}>Back To Dashboard</Button>
        </div>
      </div>
    </section>
  );
}
