import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { SeverityBadge } from "./severity-badge";
import type { AlertItem } from "./types";

interface AlertListItemProps {
  alert: AlertItem;
  active: boolean;
  onSelect: (alertId: string) => void;
}

export function AlertListItem({ alert, active, onSelect }: AlertListItemProps) {
  const isNew = alert.status === "active";

  return (
    <Card
      className={cn(
        "gap-0 py-0",
        active ? "border-2 border-blue-500 shadow-sm" : "hover:border-gray-300 transition-colors",
      )}
    >
      <Button
        variant="ghost"
        onClick={() => onSelect(alert.id)}
        className="h-auto w-full cursor-pointer justify-start p-3 text-left"
      >
        <div className="w-full">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  isNew ? "bg-blue-500" : "border border-border",
                )}
              />
              <span className="text-xs font-semibold text-muted-foreground">ID #{alert.id}</span>
            </div>
            <SeverityBadge severity={alert.severity} />
          </div>

          <div className="mt-2">
            <h4 className="text-sm font-bold text-foreground">{alert.title}</h4>
            <p className="text-[11px] text-muted-foreground">
              Detected at {formatDateTime(alert.created_at)}
            </p>
          </div>
          <p className="mt-2 text-[11px] font-medium text-primary">{alert.machine}</p>
        </div>
      </Button>
    </Card>
  );
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString();
}
