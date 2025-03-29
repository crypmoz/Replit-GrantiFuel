import { QueryClient, QueryKey } from "@tanstack/react-query";

// Query client instance for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Types for API requests
export interface RequestOptions {
  headers?: Record<string, string>;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Common API request function
export async function apiRequest(
  method: HttpMethod,
  endpoint: string,
  data?: unknown,
  options: RequestOptions = {}
) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  return fetch(endpoint, config);
}

// QueryFn generator with error handling options
export function getQueryFn({ on401 = "throw" }: { on401?: "throw" | "returnNull" } = {}) {
  return async ({ queryKey }: { queryKey: QueryKey }) => {
    const [endpoint] = queryKey as [string, ...unknown[]];
    const response = await fetch(String(endpoint), { credentials: "include" });

    if (response.status === 401) {
      if (on401 === "returnNull") {
        return null;
      }
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${await response.text()}`);
    }

    return response.json();
  };
}