import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { AlertTrendPoint } from "@/lib/api-client";

const chartConfig = {
  count: {
    label: "Alerts",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const RANGE_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
] as const;

function formatBucketDate(bucket: string): string {
  const date = new Date(bucket);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface AlertTrendChartProps {
  data: AlertTrendPoint[];
  isLoading: boolean;
  days: number;
  onDaysChange: (days: number) => void;
}

export function AlertTrendChart({ data, isLoading, days, onDaysChange }: AlertTrendChartProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Alert Trends</h2>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onDaysChange(opt.value)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                days === opt.value
                  ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-40 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No trend data available</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="alertFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="bucket"
              tickFormatter={formatBucketDate}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={32}
              allowDecimals={false}
            />
            <Tooltip
              labelFormatter={(label) => formatBucketDate(String(label))}
              formatter={(value: number) => [value, "Alerts"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#alertFill)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
