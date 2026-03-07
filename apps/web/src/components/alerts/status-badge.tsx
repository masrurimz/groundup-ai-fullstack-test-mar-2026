import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusClassMap: Record<string, string> = {
  active: "bg-severity-success-bg text-severity-success",
  acknowledged: "bg-severity-info-bg text-severity-info",
  resolved: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const classes = statusClassMap[key] ?? statusClassMap.resolved;

  return (
    <Badge className={cn("rounded px-2 py-0.5 text-[10px] font-medium tracking-wide", classes)}>
      {status}
    </Badge>
  );
}
