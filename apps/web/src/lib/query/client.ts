/**
 * Query Client singleton
 * Provides a shared TanStack Query client for the application
 */

import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | null = null;

/**
 * Get or create the shared QueryClient instance
 * Singleton pattern ensures one client per app lifecycle
 */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 10, // 10 minutes
          retry: 1,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
      },
    });
  }

  return queryClient;
}
