import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const severityClassMap: Record<string, string> = {
  critical: "bg-severity-critical-bg text-severity-critical",
  warning: "bg-severity-warning-bg text-severity-warning",
  moderate: "bg-severity-warning-bg text-severity-warning",
  info: "bg-severity-info-bg text-severity-info",
  low: "bg-muted text-muted-foreground",
};

export function SeverityBadge({ severity }: { severity: string }) {
  const key = severity.toLowerCase();
  const classes = severityClassMap[key] ?? severityClassMap.low;

  return (
    <Badge className={cn("rounded px-2 py-0.5 text-[10px] font-bold tracking-wide", classes)}>
      {severity}
    </Badge>
  );
}
