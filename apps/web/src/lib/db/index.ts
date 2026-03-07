/**
 * Database module
 * Exports TanStack DB collections and reactive query hooks
 */

export { alertsCollection } from "./collections";
export {
  useAlerts,
  useAlert,
  useAlertsByStatus,
  useAlertsBySeverity,
  useAlertsOrdered,
} from "./queries";
