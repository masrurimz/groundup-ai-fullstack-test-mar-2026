import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { SeverityBadge } from "./severity-badge";
import type { AlertItem } from "./types";

interface AlertListItemProps {
  alert: AlertItem;
  active: boolean;
  machineLabel: string;
  onSelect: (alertId: string) => void;
}

export function AlertListItem({ alert, active, machineLabel, onSelect }: AlertListItemProps) {
  return (
    <Card
      className={cn(
        "bg-card",
        active
          ? "border-primary shadow-sm"
          : "border-border transition-colors hover:border-muted-foreground/40",
      )}
    >
      <CardContent className="p-0">
        <Button
          variant="ghost"
          onClick={() => onSelect(alert.id)}
          className="h-auto w-full justify-start rounded-lg p-3 text-left hover:bg-transparent"
        >
          <div className="w-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    active ? "bg-primary" : "border border-muted-foreground/40",
                  )}
                />
                <p className="text-xs font-semibold text-muted-foreground">{alert.id}</p>
              </div>
              <SeverityBadge severity={alert.severity} />
            </div>

            <h4 className="mt-2 text-sm font-bold text-foreground">{alert.title}</h4>
            <p className="text-[11px] text-muted-foreground">
              Detected at {formatDateTime(alert.created_at)}
            </p>
            <p className="mt-2 text-[11px] font-medium text-primary">{machineLabel}</p>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString();
}
