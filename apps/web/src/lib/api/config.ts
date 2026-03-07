import { env } from "@groundup-ai-fullstack-test-mar-2026/env";

/**
 * Unified API configuration
 * All frontend API calls should use this base URL to ensure consistency
 * and facilitate updates when the backend endpoint changes.
 * 
 * Uses VITE_SERVER_URL from environment (defined in packages/env/src/web.ts)
 */
export const API_CONFIG = {
  baseUrl: env.VITE_SERVER_URL,
  apiV1Prefix: "/api/v1",
} as const;

/**
 * Get the full API v1 base URL
 */
export function getApiV1BaseUrl(): string {
  return `${API_CONFIG.baseUrl}${API_CONFIG.apiV1Prefix}`;
}
