import { SeverityBadge, StatusBadge } from "@/components/alerts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { type Alert } from "../../lib/api";

export interface RecentAlertsTableProps {
  alerts: Alert[];
  isLoading?: boolean;
  onAlertClick?: (alertId: string) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

export function RecentAlertsTable({
  alerts,
  isLoading = false,
  onAlertClick,
}: RecentAlertsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">No alerts found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
              Title
            </TableHead>
            <TableHead className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
              Severity
            </TableHead>
            <TableHead className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
              Status
            </TableHead>
            <TableHead className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
              Created
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
          {alerts.slice(0, 10).map((alert) => (
            <TableRow
              key={alert.id}
              role="button"
              tabIndex={0}
              onClick={() => onAlertClick?.(alert.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onAlertClick?.(alert.id);
                }
              }}
              className="cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <TableCell className="px-6 py-4">
                <div className="flex flex-col">
                  <p className="font-medium text-slate-900 dark:text-slate-50">{alert.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{alert.description}</p>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <SeverityBadge severity={alert.severity} />
              </TableCell>
              <TableCell className="px-6 py-4">
                <StatusBadge status={alert.status} />
              </TableCell>
              <TableCell className="px-6 py-4 text-slate-500 dark:text-slate-400">
                {formatDate(alert.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
