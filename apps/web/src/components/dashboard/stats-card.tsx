import type { ReactNode } from "react";

export interface StatsCardProps {
  title: string | ReactNode;
  value: string | number;
  icon: ReactNode;
  description?: string;
  change?: { value: number; label: string };
  variant?: "default" | "warning" | "critical";
}

const variantCard = {
  default:
    "bg-white border-slate-200 border-l-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:border-l-slate-500",
  warning:
    "bg-yellow-50 border-yellow-200 border-l-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-700 dark:border-l-yellow-500",
  critical:
    "bg-red-50 border-red-200 border-l-red-500 dark:bg-red-900/20 dark:border-red-700 dark:border-l-red-500",
} as const;

const variantIcon = {
  default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
} as const;

export function StatsCard({
  title,
  value,
  icon,
  description,
  change,
  variant = "default",
}: StatsCardProps) {
  return (
    <div className={`rounded-lg border border-l-4 p-6 ${variantCard[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
          {change && (
            <p
              className={`mt-2 text-sm font-medium ${
                change.value >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {change.value >= 0 ? "↑" : "↓"} {Math.abs(change.value)} {change.label}
            </p>
          )}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${variantIcon[variant]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
