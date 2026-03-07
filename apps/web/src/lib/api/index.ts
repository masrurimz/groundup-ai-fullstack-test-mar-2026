/**
 * Public API exports for frontend feature modules
 */

export { API_CONFIG, getApiV1BaseUrl } from "./config";
export {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  ApiError,
  type ApiResponse,
} from "./http";
export {
  fetchAlerts,
  fetchAlert,
  createAlert,
  type Alert,
  type CreateAlertRequest,
} from "./alerts";
export { fetchLookupItems, fetchLookupByCategory, type LookupItem } from "./lookup";

// Re-export database collections and query hooks from db module
export { alertsCollection } from "../db";
export {
  useAlerts,
  useAlert,
  useAlertsByStatus,
  useAlertsBySeverity,
  useAlertsOrdered,
} from "../db";
