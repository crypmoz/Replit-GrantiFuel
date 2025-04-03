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
  
  // Prepare request headers with no-cache directives
  const requestHeaders = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    ...headers
  };
  
  // Create the actual request 
  const requestPromise = fetch(url, {
    method,
    headers: requestHeaders,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: 'no-store', // Never cache requests to ensure fresh data
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
      cache: 'no-store' // Disable caching for batch requests
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
      const url = queryKey[0] as string;
      
      const res = await apiRequest('GET', url, undefined, {
        cache: 'no-store', // Consistently use no-store to prevent caching
        deduplicate: true // Deduplicate identical requests
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
  // Critical user data - should always be fresh
  user: {
    staleTime: 60 * 1000,      // 1 minute - small stale time for smoother UX
    gcTime: 30 * 60 * 1000,    // 30 minutes - keep user data longer in case of reconnection
  },
  // Application and grant data - moderate freshness
  applications: {
    staleTime: 5 * 60 * 1000,  // 5 minutes - applications don't change frequently
    gcTime: 60 * 60 * 1000,    // 60 minutes - longer retention for offline access
  },
  // Frequently changing data - shorter freshness
  documents: {
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes - increased for offline access
  },
  // AI-generated recommendations - longer caching to reduce API load
  recommendations: {
    staleTime: 30 * 60 * 1000, // 30 minutes - AI recommendations are expensive to generate
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep for an entire day
  },
  // Dashboard data - can be cached longer for better performance
  dashboard: {
    staleTime: 10 * 60 * 1000, // 10 minutes - dashboard data updates infrequently
    gcTime: 60 * 60 * 1000,    // 60 minutes - keep for offline viewing
  },
  // Default for all other data
  default: {
    staleTime: 3 * 60 * 1000,  // 3 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes - increased for better offline experience
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
  staleTime: queryDefaults.applications.staleTime, // Increased from 0 to 5 minutes
  gcTime: queryDefaults.applications.gcTime, // Increased to match applications
});

queryClient.setQueryDefaults(['/api/documents'], {
  staleTime: queryDefaults.documents.staleTime,
  gcTime: queryDefaults.documents.gcTime,
});

// Add caching settings for AI recommendations
queryClient.setQueryDefaults(['/api/ai/grant-recommendations'], {
  staleTime: queryDefaults.recommendations.staleTime,
  gcTime: queryDefaults.recommendations.gcTime,
});

// Add caching settings for chat history
queryClient.setQueryDefaults(['/api/ai/chat'], {
  staleTime: queryDefaults.recommendations.staleTime,
  gcTime: queryDefaults.recommendations.gcTime,
});

// Add caching settings for dashboard data
queryClient.setQueryDefaults(['/api/dashboard'], {
  staleTime: queryDefaults.dashboard.staleTime,
  gcTime: queryDefaults.dashboard.gcTime,
});

// Add local persistence for improved offline support
// These functions could be extended in the future to support
// local storage or IndexedDB persistence
window.addEventListener('online', () => {
  console.log('App is online, resuming background fetching');
  queryClient.resumePausedMutations();
});

window.addEventListener('offline', () => {
  console.log('App is offline, pausing background fetching');
  // Optional: Could implement offline indicators in UI here
});

// Custom error handling for network errors to improve UX
queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
    retry: (failureCount, error) => {
      // Don't retry if we get a 4xx error (client error)
      if (error instanceof Error && error.message.startsWith('4')) {
        return false;
      }
      
      // Retry network errors up to 3 times with exponential backoff
      return failureCount < 3;
    },
    onError: (error) => {
      console.error('Query error:', error);
      // Could implement global error reporting or UI notifications here
    }
  }
});
