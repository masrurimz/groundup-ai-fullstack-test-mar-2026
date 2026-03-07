/**
 * Dashboard component library
 * Typed mocks for dashboard data when integrations are not ready
 */

export { StatsCard, type StatsCardProps } from "./stats-card";
export {
  MachineBreakdownChart,
  type MachineBreakdownChartProps,
  type MachineStats,
} from "./machine-breakdown-chart";
export { RecentAlertsTable, type RecentAlertsTableProps } from "./recent-alerts-table";

/**
 * INTEGRATION POINTS (placeholders for upstream task data):
 * - MachineStats: Will be replaced by TanStack DB collections (groundup-ai-7gw)
 * - Severity/Status styling: Will respect theme tokens from groundup-ai-di8
 * - Real-time updates: Will use TanStack Query subscriptions once 7gw is complete
 */
