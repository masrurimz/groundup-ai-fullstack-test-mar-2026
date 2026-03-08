export const queryKeys = {
  alerts: ["alerts"] as const,
  alert: (id: string | number) => ["alerts", id] as const,
  machines: ["lookup", "machines"] as const,
  machinesWithInactive: ["lookup", "machines", { includeInactive: true }] as const,
  reasons: (machineID?: number) => ["lookup", "reasons", machineID ?? "all"] as const,
  reasonsWithInactive: (machineID?: number) =>
    ["lookup", "reasons", machineID ?? "all", { includeInactive: true }] as const,
  actions: ["lookup", "actions"] as const,
  actionsWithInactive: ["lookup", "actions", { includeInactive: true }] as const,
};
