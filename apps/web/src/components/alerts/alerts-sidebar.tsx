import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AlertListItem } from "./alert-list-item";
import type { AlertItem } from "./types";

export interface MachineStats {
  name: string;
  alertCount: number;
  activeCount: number;
}

interface AlertsSidebarProps {
  alerts: AlertItem[];
  selectedAlertId?: string;
  machineStats: MachineStats[];
  machineOptions: string[];
  selectedMachine?: string;
  newAlertCount: number;
  onSelectMachine: (machine: string) => void;
  onMachineChange: (machine: string) => void;
  onBack: () => void;
  onSelectAlert: (alertId: string) => void;
}

export function AlertsSidebar({
  alerts,
  selectedAlertId,
  machineStats,
  machineOptions,
  selectedMachine,
  newAlertCount,
  onSelectMachine,
  onMachineChange,
  onBack,
  onSelectAlert,
}: AlertsSidebarProps) {
  if (!selectedMachine) {
    return <MachineListPanel machineStats={machineStats} onSelectMachine={onSelectMachine} />;
  }

  return (
    <AlertListPanel
      alerts={alerts}
      selectedAlertId={selectedAlertId}
      machineOptions={machineOptions}
      selectedMachine={selectedMachine}
      newAlertCount={newAlertCount}
      onMachineChange={onMachineChange}
      onBack={onBack}
      onSelectAlert={onSelectAlert}
    />
  );
}

function MachineListPanel({
  machineStats,
  onSelectMachine,
}: {
  machineStats: MachineStats[];
  onSelectMachine: (machine: string) => void;
}) {
  const totalAlerts = machineStats.reduce((sum, m) => sum + m.alertCount, 0);

  return (
    <aside className="flex max-h-[45vh] min-h-0 flex-col border-b border-border bg-card lg:max-h-none lg:border-r lg:border-b-0">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Machines</h2>
        <p className="text-xs text-muted-foreground">{totalAlerts} total alerts</p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {machineStats.map((machine) => (
            <Card key={machine.name} className="gap-0 py-0 transition-colors hover:border-gray-300">
              <Button
                variant="ghost"
                onClick={() => onSelectMachine(machine.name)}
                className="h-auto w-full cursor-pointer justify-between p-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{machine.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {machine.alertCount} alerts
                    {machine.activeCount > 0 && (
                      <span className="ml-1 text-blue-600">· {machine.activeCount} new</span>
                    )}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

function AlertListPanel({
  alerts,
  selectedAlertId,
  machineOptions,
  selectedMachine,
  newAlertCount,
  onMachineChange,
  onBack,
  onSelectAlert,
}: {
  alerts: AlertItem[];
  selectedAlertId?: string;
  machineOptions: string[];
  selectedMachine: string;
  newAlertCount: number;
  onMachineChange: (machine: string) => void;
  onBack: () => void;
  onSelectAlert: (alertId: string) => void;
}) {
  return (
    <aside className="flex max-h-[45vh] min-h-0 flex-col border-b border-border bg-card lg:max-h-none lg:border-r lg:border-b-0">
      {/* Machine Selector */}
      <div className="border-b border-border p-4">
        <Select
          value={selectedMachine}
          onValueChange={(value) => {
            if (value != null) onMachineChange(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {machineOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Back Navigation */}
      <div className="border-b border-border p-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Alert Count */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
        <p className="text-sm font-medium text-muted-foreground">{alerts.length} Alerts</p>
        {newAlertCount > 0 && (
          <Badge className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            {newAlertCount} New
          </Badge>
        )}
      </div>

      {/* Alert List */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-3">
          {alerts.map((alert) => (
            <AlertListItem
              key={alert.id}
              alert={alert}
              active={alert.id === selectedAlertId}
              onSelect={onSelectAlert}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
