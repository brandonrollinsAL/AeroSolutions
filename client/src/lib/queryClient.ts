import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Error handling with more detailed error types
export class ApiError extends Error {
  status: number;
  statusText: string;
  data: any;

  constructor(status: number, statusText: string, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }

  static fromResponse(res: Response, data?: any): ApiError {
    return new ApiError(
      res.status,
      res.statusText,
      `API Error: ${res.status} ${res.statusText}`,
      data
    );
  }
}

// Improved error handling with detailed error information
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorData = null;
    let errorText = '';
    
    try {
      // Try to parse as JSON first
      errorData = await res.json();
      errorText = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch (e) {
      // If not JSON, get text content
      try {
        errorText = await res.text() || res.statusText;
      } catch (textError) {
        errorText = res.statusText;
      }
    }
    
    throw new ApiError(res.status, res.statusText, errorText, errorData);
  }
}

// Enhanced API request with better error handling, timeouts, and retries
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const { 
    timeout = 30000, // 30 second default timeout
    retries = 0,
    headers = {}
  } = options || {};
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Prepare request headers
    const requestHeaders: Record<string, string> = {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...headers,
    };
    
    // Add security headers
    requestHeaders["X-Requested-With"] = "XMLHttpRequest";
    
    // Make the fetch request with all options
    const res = await fetch(url, {
      method,
      headers: requestHeaders,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
      cache: "no-cache", // Prevent caching of API calls for security
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timeout: The request took longer than ${timeout}ms`);
    }
    
    // Handle retry logic
    if (retries > 0 && !(error instanceof ApiError && error.status >= 400 && error.status < 500)) {
      console.warn(`Request failed, retrying... (${retries} retries left)`);
      return apiRequest(method, url, data, {
        ...options,
        retries: retries - 1
      });
    }
    
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Enhanced query function with better error handling, caching, and security
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  timeout?: number;
  retries?: number;
  cacheTime?: number;
}) => QueryFunction<T> =
  ({ 
    on401: unauthorizedBehavior,
    timeout = 30000,  // 30 second default timeout
    retries = 1,      // Default 1 retry for data fetching
    cacheTime = 300   // 5 minutes default cache time
  }) =>
  async ({ queryKey, signal }) => {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Use the controller signal and handle the provided signal in the catch block
    const abortSignal = controller.signal;
    
    try {
      // Security headers to prevent CSRF attacks
      const headers: Record<string, string> = {
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": `max-age=${cacheTime}`
      };
      
      // Make the fetch request with proper security and timeout settings
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers,
        signal: abortSignal,
      });

      // Handle unauthorized access according to specified behavior
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      // Process response with our enhanced error handling
      await throwIfResNotOk(res);
      
      // Parse and return the response data
      const data = await res.json();
      
      // Add response metadata for debugging and logging
      return {
        ...data,
        _meta: {
          timestamp: new Date().toISOString(),
          status: res.status,
          url: queryKey[0],
        }
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Request timeout: The operation took longer than ${timeout}ms`);
      }
      
      // Handle retry logic - delegate to React Query's retry mechanism
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

// Enhanced, production-ready query client with better error handling, 
// caching, and optimized performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ 
        on401: "throw",
        timeout: 30000,      // 30 second timeout
        retries: 2           // Retry failed requests twice
      }),
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx client errors
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: import.meta.env.PROD, // Only refetch in production
      refetchOnReconnect: true,
      refetchOnMount: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - renamed from cacheTime in v5
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx client errors
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry at most once for other errors
        return failureCount < 1;
      }
    },
  },
});
