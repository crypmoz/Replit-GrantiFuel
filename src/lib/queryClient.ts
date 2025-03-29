import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Define a type-safe default query function
const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  // Convert the query key to a string
  const url = Array.isArray(queryKey) ? queryKey[0] as string : queryKey as string;
  
  const res = await fetch(url, { 
    credentials: "include" 
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`API error: ${res.statusText}`);
  }

  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json();
  }

  return res.text();
};

type QueryFnOptions = {
  on401?: "throw" | "returnNull";
};

export function getQueryFn({ on401 = "throw" }: QueryFnOptions = {}) {
  // Return a type-safe query function
  const queryFn: QueryFunction = async ({ queryKey }) => {
    try {
      // Convert the query key to a string
      const url = Array.isArray(queryKey) ? queryKey[0] as string : queryKey as string;
      
      const res = await fetch(url, { 
        credentials: "include" 
      });
  
      if (!res.ok) {
        if (res.status === 401 && on401 === "returnNull") {
          return undefined;
        }
        if (res.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error(`API error: ${res.statusText}`);
      }
  
      if (res.headers.get('content-type')?.includes('application/json')) {
        return res.json();
      }
  
      return res.text();
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized" && on401 === "returnNull") {
        return undefined;
      }
      throw err;
    }
  };
  
  return queryFn;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiRequest(
  method: HttpMethod,
  url: string,
  data?: any,
  options: RequestInit = {}
): Promise<Response> {
  const isFormData = data instanceof FormData;
  
  // Create a headers object properly
  const headers = new Headers(options.headers);
  
  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    method,
    credentials: "include",
    headers,
    ...options,
  };

  if (data !== undefined) {
    config.body = isFormData ? data : JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || response.statusText);
  }

  return response;
}