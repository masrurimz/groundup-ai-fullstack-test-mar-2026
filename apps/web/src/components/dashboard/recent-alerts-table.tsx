import { type Alert } from "../../lib/api";

export interface RecentAlertsTableProps {
  alerts: Alert[];
  isLoading?: boolean;
  onAlertClick?: (alertId: string) => void;
}

const severityStyles = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200",
};

const statusStyles = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  resolved: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200",
  acknowledged: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
};

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
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
              Title
            </th>
            <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
              Severity
            </th>
            <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
              Status
            </th>
            <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {alerts.slice(0, 10).map((alert) => (
            <tr
              key={alert.id}
              onClick={() => onAlertClick?.(alert.id)}
              className="cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <p className="font-medium text-slate-900 dark:text-slate-50">{alert.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{alert.description}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                    severityStyles[alert.severity as keyof typeof severityStyles] ||
                    severityStyles.low
                  }`}
                >
                  {alert.severity}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                    statusStyles[alert.status as keyof typeof statusStyles] || statusStyles.resolved
                  }`}
                >
                  {alert.status}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                {formatDate(alert.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
