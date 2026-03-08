/**
 * Lookup API adapter using generated OpenAPI SDK.
 */

import {
  getActionsApiV1LookupActionsGet,
  getLookupItemsApiV1LookupGet,
  getReasonsApiV1LookupReasonsGet,
  type LookupItem,
} from "../api-client";

import { getApiClient } from "./client";

/**
 * Fetch all lookup items.
 */
export async function fetchLookupItems(): Promise<LookupItem[]> {
  const { data } = await getLookupItemsApiV1LookupGet({
    client: getApiClient(),
    throwOnError: true,
  });
  return data ?? [];
}

/**
 * Fetch lookup items by category.
 */
export async function fetchLookupByCategory(category: string): Promise<LookupItem[]> {
  const { data } = await getLookupItemsApiV1LookupGet({
    client: getApiClient(),
    throwOnError: true,
    query: { category },
  });
  return data ?? [];
}

/**
 * Fetch reason options for a machine.
 */
export async function fetchReasons(machine: string): Promise<LookupItem[]> {
  const { data } = await getReasonsApiV1LookupReasonsGet({
    client: getApiClient(),
    throwOnError: true,
    query: { machine },
  });
  return data ?? [];
}

/**
 * Fetch all action options.
 */
export async function fetchActions(): Promise<LookupItem[]> {
  const { data } = await getActionsApiV1LookupActionsGet({
    client: getApiClient(),
    throwOnError: true,
  });
  return data ?? [];
}

export type { LookupItem };
