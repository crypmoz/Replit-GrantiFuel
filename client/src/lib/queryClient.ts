import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Store in-flight requests to deduplicate concurrent identical API calls
const pendingRequests = new Map<string, Promise<Response>>();

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    deduplicate?: boolean;
    cache?: RequestCache;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const { deduplicate = true, cache = 'default', headers = {} } = options || {};
  
  // Create a unique key for this request for deduplication
  const requestKey = `${method}:${url}:${data ? JSON.stringify(data) : ''}`;
  
  // For GET requests that can be deduplicated
  if (deduplicate && method === 'GET' && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)!;
  }
  
  // Prepare request headers
  const requestHeaders = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...headers
  };
  
  // Create the actual request 
  const requestPromise = fetch(url, {
    method,
    headers: requestHeaders,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: method === 'GET' ? cache : 'no-store', // Only cache GET requests
  }).then(async (res) => {
    // Remove from pending requests map
    if (deduplicate) {
      pendingRequests.delete(requestKey);
    }
    
    await throwIfResNotOk(res);
    return res;
  }).catch(error => {
    // Remove from pending requests map on error too
    if (deduplicate) {
      pendingRequests.delete(requestKey);
    }
    throw error;
  });
  
  // Store this request promise to deduplicate concurrent calls
  if (deduplicate) {
    pendingRequests.set(requestKey, requestPromise);
  }
  
  return requestPromise;
}

// Batch API for improved performance
export interface BatchRequest {
  url: string;
  method?: string;
  body?: any;
}

export async function apiBatchRequest(requests: BatchRequest[]): Promise<any[]> {
  if (requests.length === 0) {
    return [];
  }
  
  // Handle large batches by chunking them into smaller groups
  if (requests.length > 20) {
    console.warn('Large batch request detected, chunking into smaller requests');
    
    const chunks: BatchRequest[][] = [];
    for (let i = 0; i < requests.length; i += 20) {
      chunks.push(requests.slice(i, i + 20));
    }
    
    // Process each chunk sequentially to avoid overwhelming the server
    const results: any[] = [];
    for (const chunk of chunks) {
      const chunkResults = await apiBatchRequest(chunk);
      results.push(...chunkResults);
    }
    
    return results;
  }
  
  // Process a standard batch request
  try {
    const res = await apiRequest('POST', '/api/batch', { requests }, {
      deduplicate: true,
      cache: 'force-cache' // Enable HTTP caching for GET requests
    });
    
    const data = await res.json();
    return data.results;
  } catch (error) {
    console.error('Batch request failed, falling back to individual requests', error);
    
    // If batch request fails, fall back to individual requests
    return Promise.all(
      requests.map(async (request) => {
        try {
          const { url, method = 'GET', body } = request;
          const res = await apiRequest(method, url, body);
          const data = await res.json();
          return { status: res.status, data };
        } catch (error) {
          console.error(`Individual request failed for ${request.url}`, error);
          return { 
            status: error instanceof Error && error.message.startsWith('4') ? 400 : 500,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
  }
}

/**
 * Utility function to help fetch multiple resources in parallel using the batch API
 * @param resources Array of API paths to fetch
 * @returns Object with resources as keys and their data as values
 */
export async function fetchResources(resources: string[]): Promise<Record<string, any>> {
  // Create batch requests for GET operations
  const batchRequests = resources.map(path => ({ url: path, method: 'GET' }));
  
  // Execute the batch request
  const results = await apiBatchRequest(batchRequests);
  
  // Map results back to their resource paths
  const resourceMap: Record<string, any> = {};
  results.forEach((result, index) => {
    if (result.status >= 200 && result.status < 300) {
      resourceMap[resources[index]] = result.data;
    } else {
      console.warn(`Failed to fetch resource ${resources[index]}:`, result.error);
      resourceMap[resources[index]] = null;
    }
  });
  
  return resourceMap;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Use our optimized apiRequest function instead of direct fetch
      const res = await apiRequest('GET', queryKey[0] as string, undefined, {
        cache: 'force-cache', // Enable HTTP caching for better performance
        deduplicate: true     // Deduplicate identical requests
      });
      
      const data = await res.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('401:')) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }
      throw error;
    }
  };

// Create categories of cached data with appropriate stale times
const queryDefaults = {
  // Critical user data - stays fresh longer
  user: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 60 minutes
  },
  // Application and grant data - moderate freshness
  applications: {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 15 * 60 * 1000,    // 15 minutes
  },
  // Frequently changing data - shorter freshness
  documents: {
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  },
  // Default for all other data
  default: {
    staleTime: 3 * 60 * 1000,  // 3 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: queryDefaults.default.staleTime,
      gcTime: queryDefaults.default.gcTime, 
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Apply specific cache settings based on endpoint patterns
queryClient.setQueryDefaults(['/api/user'], {
  staleTime: queryDefaults.user.staleTime,
  gcTime: queryDefaults.user.gcTime,
});

queryClient.setQueryDefaults(['/api/applications'], {
  staleTime: queryDefaults.applications.staleTime,
  gcTime: queryDefaults.applications.gcTime,
});

queryClient.setQueryDefaults(['/api/grants'], {
  staleTime: queryDefaults.applications.staleTime,
  gcTime: queryDefaults.applications.gcTime,
});

queryClient.setQueryDefaults(['/api/documents'], {
  staleTime: queryDefaults.documents.staleTime,
  gcTime: queryDefaults.documents.gcTime,
});
