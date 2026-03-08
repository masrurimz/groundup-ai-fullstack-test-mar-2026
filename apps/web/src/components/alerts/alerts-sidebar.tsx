import { ChevronLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const ALL_MACHINES = "All Machines";

interface AlertsSidebarProps {
  alerts: AlertItem[];
  selectedAlertId?: string;
  machineOptions: string[];
  selectedMachine?: string;
  newAlertCount: number;
  onMachineChange: (machine: string | undefined) => void;
  onBack: () => void;
  onSelectAlert: (alertId: string) => void;
}

export function AlertsSidebar({
  alerts,
  selectedAlertId,
  machineOptions,
  selectedMachine,
  newAlertCount,
  onMachineChange,
  onBack,
  onSelectAlert,
}: AlertsSidebarProps) {
  return (
    <aside className="flex max-h-[45vh] min-h-0 flex-col border-b border-border bg-card lg:max-h-none lg:border-r lg:border-b-0">
      {/* Machine Filter */}
      <div className="border-b border-border p-4">
        <Select
          value={selectedMachine ?? ALL_MACHINES}
          onValueChange={(value) => {
            if (value != null) onMachineChange(value === ALL_MACHINES ? undefined : value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MACHINES}>All Machines</SelectItem>
            {machineOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Back to Dashboard */}
      <div className="border-b border-border p-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
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
