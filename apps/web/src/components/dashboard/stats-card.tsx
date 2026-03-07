import type { ReactNode } from "react";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    direction: "up" | "down" | "stable";
    percentage: number;
  };
  variant?: "default" | "warning" | "critical";
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  variant = "default",
}: StatsCardProps) {
  const variantClasses = {
    default: "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700",
    warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700",
    critical: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700",
  };

  const trendColorClasses = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    stable: "text-gray-600 dark:text-gray-400",
  };

  const trendIcon = {
    up: "↑",
    down: "↓",
    stable: "→",
  };

  return (
    <div className={`rounded-lg border p-6 ${variantClasses[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
          {trend && (
            <p className={`mt-2 text-sm font-medium ${trendColorClasses[trend.direction]}`}>
              {trendIcon[trend.direction]} {trend.percentage}%
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200/50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </div>
      </div>
    </div>
  );
}
