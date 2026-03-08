import { getApiV1BaseUrl } from "./config";

/**
 * Shared HTTP wrapper for frontend API calls.
 * All feature API requests should go through this boundary
 * to ensure consistent error handling, auth, and request/response transformation.
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Make an authenticated API request to the v1 backend
 * @param path - API endpoint path (e.g., "/alerts" gets prepended with /api/v1)
 * @param init - Fetch RequestInit options
 * @returns Parsed response data
 * @throws ApiError on non-2xx status or fetch failure
 */
export async function apiRequest<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiV1BaseUrl()}${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      ...init,
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }

      throw new ApiError(
        response.status,
        `API request failed: ${response.status} ${response.statusText}`,
        errorData,
      );
    }

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      0,
      `Network error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Helper for GET requests
 */
export function apiGet<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "GET" });
}

/**
 * Helper for POST requests
 */
export function apiPost<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, {
    ...init,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PUT requests
 */
export function apiPut<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, {
    ...init,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PATCH requests
 */
export function apiPatch<T = unknown>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return apiRequest<T>(path, {
    ...init,
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for DELETE requests
 */
export function apiDelete<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "DELETE" });
}
