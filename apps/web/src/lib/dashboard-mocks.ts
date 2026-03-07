/**
 * Dashboard data mocks
 * TEMPORARY: Replace with TanStack DB collections (groundup-ai-7gw) when ready
 */

import type { Alert } from "./api";
import type { MachineStats } from "../components/dashboard/machine-breakdown-chart";

/**
 * Mock machine status data
 * TODO: Replace with real TanStack DB collection query when 7gw integration is ready
 */
export function createMockMachineStats(): MachineStats[] {
  return [
    {
      name: "prod-server-01",
      status: "healthy",
      uptime: 99.8,
      alertCount: 0,
    },
    {
      name: "prod-server-02",
      status: "healthy",
      uptime: 99.5,
      alertCount: 1,
    },
    {
      name: "prod-db-01",
      status: "warning",
      uptime: 98.2,
      alertCount: 3,
    },
    {
      name: "staging-server-01",
      status: "critical",
      uptime: 45.0,
      alertCount: 8,
    },
    {
      name: "cache-node-01",
      status: "healthy",
      uptime: 99.9,
      alertCount: 0,
    },
  ];
}

/**
 * Mock alerts data
 * TODO: Replace with real TanStack Query when 7gw integration is ready
 */
export function createMockAlerts(): Alert[] {
  const now = new Date();
  return [
    {
      id: "alert-001",
      title: "High CPU Usage",
      description: "prod-server-01 CPU usage above 85%",
      severity: "warning",
      status: "active",
      created_at: new Date(now.getTime() - 5 * 60000).toISOString(),
      updated_at: new Date(now.getTime() - 5 * 60000).toISOString(),
    },
    {
      id: "alert-002",
      title: "Database Connection Pool Exhausted",
      description: "prod-db-01 connection pool at capacity",
      severity: "critical",
      status: "active",
      created_at: new Date(now.getTime() - 15 * 60000).toISOString(),
      updated_at: new Date(now.getTime() - 10 * 60000).toISOString(),
    },
    {
      id: "alert-003",
      title: "Disk Space Low",
      description: "staging-server-01 disk space below 10%",
      severity: "critical",
      status: "active",
      created_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
    },
    {
      id: "alert-004",
      title: "Memory Pressure",
      description: "prod-db-01 memory usage above 90%",
      severity: "warning",
      status: "acknowledged",
      created_at: new Date(now.getTime() - 4 * 3600000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 3600000).toISOString(),
    },
    {
      id: "alert-005",
      title: "Service Restart",
      description: "cache-node-01 restarted unexpectedly",
      severity: "info",
      status: "resolved",
      created_at: new Date(now.getTime() - 24 * 3600000).toISOString(),
      updated_at: new Date(now.getTime() - 23 * 3600000).toISOString(),
    },
  ];
}

/**
 * Dashboard statistics summary
 * TODO: Compute from TanStack DB queries when 7gw integration is ready
 */
export function computeDashboardStats(machines: MachineStats[], alerts: Alert[]) {
  const healthyCount = machines.filter((m) => m.status === "healthy").length;
  const criticalCount = machines.filter((m) => m.status === "critical").length;
  const activeAlertsCount = alerts.filter((a) => a.status === "active").length;
  const avgUptime =
    machines.length > 0
      ? Math.round(machines.reduce((sum, m) => sum + m.uptime, 0) / machines.length)
      : 0;

  return {
    totalMachines: machines.length,
    healthyMachines: healthyCount,
    criticalMachines: criticalCount,
    activeAlerts: activeAlertsCount,
    averageUptime: avgUptime,
  };
}
