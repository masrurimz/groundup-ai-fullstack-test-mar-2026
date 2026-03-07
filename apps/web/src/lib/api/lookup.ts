/**
 * Lookup API adapter using generated OpenAPI SDK.
 */

import { getLookupItemsApiV1LookupGet, type LookupItem } from "../api-client";

import { getApiClient } from "./client";

/**
 * Fetch all lookup items.
 */
export async function fetchLookupItems(): Promise<LookupItem[]> {
  const data = await getLookupItemsApiV1LookupGet({ client: getApiClient() });
  return data ?? [];
}

/**
 * Fetch lookup items by category.
 */
export async function fetchLookupByCategory(category: string): Promise<LookupItem[]> {
  const data = await getLookupItemsApiV1LookupGet({
    client: getApiClient(),
    query: { category },
  });
  return data ?? [];
}

export type { LookupItem };
