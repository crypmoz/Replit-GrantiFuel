import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

interface APIRequestOptions {
  headers?: HeadersInit;
  on401?: "redirect" | "returnNull" | "throw";
}

/**
 * Make an API request to the server
 */
export async function apiRequest(
  method: string,
  path: string,
  body?: any,
  options: APIRequestOptions = {}
) {
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (response.status === 401) {
    if (options.on401 === "redirect") {
      window.location.href = "/auth";
      return new Promise(() => {});
    } else if (options.on401 === "returnNull") {
      return { json: async () => null };
    } else if (options.on401 === "throw" || !options.on401) {
      throw new Error("Unauthorized");
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || `API request failed with status ${response.status}`
    );
    Object.assign(error, errorData);
    throw error;
  }

  return response;
}

interface GetQueryFnOptions {
  on401?: "redirect" | "returnNull" | "throw";
}

/**
 * Get a query function for use with react-query
 */
export function getQueryFn(options: GetQueryFnOptions = {}) {
  return async ({ queryKey }: { queryKey: string[] }) => {
    // If queryKey is an array, join the segments with /, ensuring no double slashes
    const path = Array.isArray(queryKey[0])
      ? queryKey[0].join("/").replace(/\/+/g, "/")
      : queryKey.join("/").replace(/\/+/g, "/");

    const response = await apiRequest("GET", path, undefined, {
      on401: options.on401,
    });

    // Handle empty response for 204 No Content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  };
}

/**
 * Get a mutation function for use with react-query
 */
export function getMutationFn<TVariables = any, TResponse = any>(
  method: string,
  path: string,
  options: APIRequestOptions = {}
) {
  return async (variables: TVariables): Promise<TResponse> => {
    const response = await apiRequest(method, path, variables, options);
    return response.json();
  };
}

export function buildUrlWithParams(base: string, params: Record<string, string>) {
  const url = new URL(base, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value);
    }
  });
  return url.pathname + url.search;
}