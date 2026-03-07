/**
 * Lookup API adapter using generated OpenAPI SDK.
 */

import { getLookupItemsApiV1LookupGet, type LookupItem } from "../api-client";

import { getApiClient } from "./client";

function unwrapResponse<T>(result: unknown): T | undefined {
  if (result && typeof result === "object" && !Array.isArray(result) && "data" in result) {
    return (result as { data?: T }).data;
  }

  return result as T;
}

/**
 * Fetch all lookup items.
 */
export async function fetchLookupItems(): Promise<LookupItem[]> {
  const result = await getLookupItemsApiV1LookupGet({ client: getApiClient() });
  return unwrapResponse<LookupItem[]>(result) ?? [];
}

/**
 * Fetch lookup items by category.
 */
export async function fetchLookupByCategory(category: string): Promise<LookupItem[]> {
  const result = await getLookupItemsApiV1LookupGet({
    client: getApiClient(),
    query: { category },
  });
  return unwrapResponse<LookupItem[]>(result) ?? [];
}

export type { LookupItem };
