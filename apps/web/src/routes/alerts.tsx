import { Outlet, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo } from "react";

import { AlertsSidebar, type MachineStats } from "@/components/alerts/alerts-sidebar";

import { useAlertsApi } from "../lib/api/use-alerts-api";

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

  const machineStats: MachineStats[] = useMemo(() => {
    const map = new Map<string, { alertCount: number; activeCount: number }>();
    for (const alert of alerts) {
      const stats = map.get(alert.machine) ?? { alertCount: 0, activeCount: 0 };
      stats.alertCount += 1;
      if (alert.status === "active") stats.activeCount += 1;
      map.set(alert.machine, stats);
    }
    return [...map.entries()]
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [alerts]);

  const filteredAlerts = useMemo(
    () => (machine ? alerts.filter((a) => a.machine === machine) : alerts),
    [alerts, machine],
  );

  const newAlertCount = useMemo(
    () => filteredAlerts.filter((a) => a.status === "active").length,
    [filteredAlerts],
  );

  const handleSelectMachine = (name: string) => {
    void navigate({ to: "/alerts", search: { machine: name } });
  };

  const handleMachineChange = (value: string) => {
    void navigate({
      to: "/alerts",
      search: { machine: value },
      replace: true,
    });
  };

  const handleBack = () => {
    if (alertId) {
      void navigate({ to: "/alerts", search: { machine } });
    } else {
      void navigate({ to: "/alerts", search: { machine: undefined } });
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
        machineStats={machineStats}
        machineOptions={machineOptions}
        selectedMachine={machine}
        newAlertCount={newAlertCount}
        onSelectMachine={handleSelectMachine}
        onMachineChange={handleMachineChange}
        onBack={handleBack}
        onSelectAlert={handleSelectAlert}
      />

      <Outlet />
    </main>
  );
}
