/**
 * Lookup API - use shared HTTP boundary for all calls
 * Endpoints aligned with backend /api/v1/lookup routes
 */

import { apiGet } from "./http";

export interface LookupItem {
  id: string;
  name: string;
  category: string;
}

/**
 * Fetch all lookup items
 */
export async function fetchLookupItems(): Promise<LookupItem[]> {
  return apiGet<LookupItem[]>("/lookup");
}

/**
 * Fetch lookup items by category
 */
export async function fetchLookupByCategory(category: string): Promise<LookupItem[]> {
  return apiGet<LookupItem[]>(`/lookup?category=${encodeURIComponent(category)}`);
}
