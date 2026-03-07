import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

import { useAlertsApi } from "../lib/api/use-alerts-api";

export const Route = createFileRoute("/alerts/")({
  ssr: false,
  component: AlertsIndexPage,
});

function AlertsIndexPage() {
  const navigate = useNavigate();
  const { alerts, isLoading } = useAlertsApi();
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
      <main className="grid h-full place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Loading alerts workspace...</p>
      </main>
    );
  }

  return (
    <main className="grid h-full place-items-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">No Alerts Available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Alerts will appear here once data is available from the monitoring pipeline.
        </p>
        <div className="mt-6">
          <Button onClick={() => void navigate({ to: "/" })}>Back To Dashboard</Button>
        </div>
      </div>
    </main>
  );
}
