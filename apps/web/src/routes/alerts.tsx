import { Outlet, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo } from "react";

import { AlertsSidebar } from "@/components/alerts/alerts-sidebar";

import { useAlertsApi } from "../lib/api/use-alerts-api";

const ALL_MACHINES = "__all__";

export const Route = createFileRoute("/alerts")({
  validateSearch: (search: Record<string, unknown>) => ({
    machine:
      typeof search.machine === "string" && search.machine.trim()
        ? search.machine.trim()
        : undefined,
  }),
  component: AlertsLayout,
});

function AlertsLayout() {
  const navigate = useNavigate();
  const { alerts } = useAlertsApi();
  const { machine } = Route.useSearch();
  const params = useParams({ strict: false });
  const alertId = (params as { alertId?: string }).alertId;

  const machineOptions = useMemo(() => [...new Set(alerts.map((a) => a.machine))].sort(), [alerts]);

  const filteredAlerts = useMemo(
    () => (machine ? alerts.filter((a) => a.machine === machine) : alerts),
    [alerts, machine],
  );

  const newAlertCount = useMemo(
    () => filteredAlerts.filter((a) => a.status === "active").length,
    [filteredAlerts],
  );

  const handleMachineChange = (value: string) => {
    const next = value === ALL_MACHINES ? undefined : value;
    void navigate({
      to: "/alerts",
      search: { machine: next },
      replace: true,
    });
  };

  const handleBack = () => {
    if (alertId) {
      void navigate({ to: "/alerts", search: { machine } });
    } else {
      void navigate({ to: "/" });
    }
  };

  const handleSelectAlert = (id: string) => {
    void navigate({
      to: "/alerts/$alertId",
      params: { alertId: id },
      search: { machine },
    });
  };

  return (
    <main className="grid h-full min-h-0 grid-cols-1 overflow-hidden bg-background lg:grid-cols-[320px_1fr]">
      <AlertsSidebar
        alerts={filteredAlerts}
        selectedAlertId={alertId}
        machineOptions={machineOptions}
        selectedMachine={machine ?? ALL_MACHINES}
        newAlertCount={newAlertCount}
        onMachineChange={handleMachineChange}
        onBack={handleBack}
        onSelectAlert={handleSelectAlert}
      />

      <Outlet />
    </main>
  );
}
