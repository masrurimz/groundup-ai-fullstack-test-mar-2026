import { Outlet, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

import { AlertsSidebar } from "@/components/alerts/alerts-sidebar";

import { useAlertsApi } from "../lib/api/use-alerts-api";

export const Route = createFileRoute("/alerts")({
  component: AlertsLayout,
});

function AlertsLayout() {
  const navigate = useNavigate();
  const { alerts, isLoading } = useAlertsApi();
  const params = useParams({ strict: false });
  const alertId = (params as { alertId?: string }).alertId;

  const machineLabel =
    alerts.find((a) => a.id === alertId)?.description?.split(" ")[0] ?? "CNC Machine";

  return (
    <main className="grid h-full min-h-0 grid-cols-1 overflow-hidden bg-background lg:grid-cols-[320px_1fr]">
      <AlertsSidebar
        alerts={alerts}
        selectedAlertId={alertId}
        machineLabel={machineLabel}
        onBack={() => navigate({ to: "/" })}
        onSelectAlert={(id) => navigate({ to: "/alerts/$alertId", params: { alertId: id } })}
      />

      <Outlet />
    </main>
  );
}
