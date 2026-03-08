import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface AlertTrendBucket {
  bucket: string;
  critical: number;
  warning: number;
  mild: number;
  total: number;
}

const chartConfig = {
  critical: { label: "Critical", color: "hsl(0, 72%, 51%)" },
  warning: { label: "Warning", color: "hsl(38, 92%, 50%)" },
  mild: { label: "Info", color: "hsl(217, 91%, 60%)" },
} satisfies ChartConfig;

function formatBucketDate(bucket: string): string {
  const date = new Date(bucket);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface AlertTrendChartProps {
  data: AlertTrendBucket[];
  isLoading: boolean;
}

export function AlertTrendChart({ data, isLoading }: AlertTrendChartProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Alert Trends</h2>
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
              <linearGradient id="critFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="warnFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="mildFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.0} />
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
              formatter={(value: number, name: string) => [
                value,
                chartConfig[name as keyof typeof chartConfig]?.label ?? name,
              ]}
            />
            <Area
              type="monotone"
              dataKey="critical"
              stackId="stack"
              stroke="hsl(0, 72%, 51%)"
              strokeWidth={2}
              fill="url(#critFill)"
            />
            <Area
              type="monotone"
              dataKey="warning"
              stackId="stack"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2}
              fill="url(#warnFill)"
            />
            <Area
              type="monotone"
              dataKey="mild"
              stackId="stack"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              fill="url(#mildFill)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
