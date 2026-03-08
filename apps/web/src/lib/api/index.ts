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

// Re-export database collections and query hooks from db module
export { alertsCollection } from "../db";
export {
  useAlerts,
  useAlert,
  useAlertsByStatus,
  useAlertsBySeverity,
  useAlertsOrdered,
} from "../db";
