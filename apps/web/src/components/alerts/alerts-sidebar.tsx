import { ChevronDown, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { AlertListItem } from "./alert-list-item";
import type { AlertItem } from "./types";

interface AlertsSidebarProps {
  alerts: AlertItem[];
  selectedAlertId?: string;
  machineLabel: string;
  onBack: () => void;
  onSelectAlert: (alertId: string) => void;
}

export function AlertsSidebar({
  alerts,
  selectedAlertId,
  machineLabel,
  onBack,
  onSelectAlert,
}: AlertsSidebarProps) {
  return (
    <aside className="flex max-h-[45vh] min-h-0 flex-col border-b border-border bg-card lg:max-h-none lg:border-r lg:border-b-0">
      <div className="p-4">
        <Button
          variant="outline"
          aria-label="Select machine filter"
          className="w-full justify-between rounded-md px-3 py-2 text-sm text-foreground"
        >
          <span>{machineLabel}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      <div className="p-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="px-0 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Separator />

      <div className="flex items-center justify-between bg-muted/40 px-4 py-3">
        <p className="text-sm font-medium text-muted-foreground">{alerts.length} Alerts</p>
        <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
          2 New
        </span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-3">
          {alerts.map((alert) => (
            <AlertListItem
              key={alert.id}
              alert={alert}
              active={alert.id === selectedAlertId}
              machineLabel={machineLabel}
              onSelect={onSelectAlert}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
