import { API_BASE_URL } from "@/utils/constants";

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
  fromCache?: boolean;
};

export type RequestOptions = RequestInit & {
  // If true, bypasses the cache and forces a fresh network request
  forceRefresh?: boolean;
  // Custom TTL in milliseconds (defaults are based on endpoint type)
  ttlMs?: number;
};

type CacheEntry<T = any> = {
  data: ApiResponse<T>;
  timestamp: number;
  ttl: number;
};

// Default cache lifetimes by endpoint pattern (in milliseconds)
const ENDPOINT_TTLS: Array<{ pattern: string; ttl: number }> = [
  { pattern: "/api/users/cups", ttl: 5 * 60 * 1000 },          // 5 minutes (cups rarely change)
  { pattern: "/api/users/achievements", ttl: 5 * 60 * 1000 },  // 5 minutes
  { pattern: "/api/users/profile", ttl: 3 * 60 * 1000 },       // 3 minutes
  { pattern: "/api/users/weekly-stats", ttl: 2 * 60 * 1000 },  // 2 minutes (heavy aggregation query)
  { pattern: "/api/users/daily-stats", ttl: 60 * 1000 },       // 1 minute
  { pattern: "/api/users/water-logs", ttl: 60 * 1000 },        // 1 minute
];

const DEFAULT_TTL = 60 * 1000; // 1 minute default for unspecified GET endpoints

class ApiClient {
  private baseUrl: string;
  private cache = new Map<string, CacheEntry>();
  private inFlightRequests = new Map<string, Promise<ApiResponse<any>>>();
  private listeners = new Set<(event: { type: "invalidate"; patterns: string[] }) => void>();

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  /**
   * Determine the TTL for a given endpoint
   */
  private getTtlForEndpoint(endpoint: string, customTtl?: number): number {
    if (typeof customTtl === "number" && customTtl >= 0) {
      return customTtl;
    }
    const clean = endpoint.toLowerCase();
    for (const rule of ENDPOINT_TTLS) {
      if (clean.includes(rule.pattern)) {
        return rule.ttl;
      }
    }
    return DEFAULT_TTL;
  }

  /**
   * Build a unique cache key for a request
   */
  private buildCacheKey(method: string, endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${method.toUpperCase()}:${cleanEndpoint}`;
  }

  /**
   * Automatically invalidate cached data when a mutating HTTP request succeeds
   */
  private handleMutationInvalidation(endpoint: string) {
    const clean = endpoint.toLowerCase();
    const invalidatedPatterns: string[] = [];

    if (clean.includes("/water-logs")) {
      // Adding or removing water logs affects stats, logs, and achievements
      invalidatedPatterns.push("/water-logs", "/daily-stats", "/weekly-stats", "/achievements");
    } else if (clean.includes("/cups")) {
      // Adding, updating, or deleting cups affects cups list
      invalidatedPatterns.push("/cups");
    } else if (clean.includes("/profile")) {
      // Profile changes affect profile and potentially daily goal
      invalidatedPatterns.push("/profile", "/daily-stats");
    } else if (clean.includes("/initialize-profile")) {
      this.clearCache();
      return;
    }

    if (invalidatedPatterns.length > 0) {
      this.invalidate(invalidatedPatterns);
    }
  }

  /**
   * Invalidate cache entries matching any of the given patterns
   */
  invalidate(patterns: string | string[]) {
    const patternList = Array.isArray(patterns) ? patterns : [patterns];
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      const lowerKey = key.toLowerCase();
      for (const pattern of patternList) {
        if (lowerKey.includes(pattern.toLowerCase())) {
          keysToDelete.push(key);
          break;
        }
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    // Notify any active listeners of the invalidation
    for (const listener of this.listeners) {
      try {
        listener({ type: "invalidate", patterns: patternList });
      } catch (err) {
        console.error("Error in cache listener:", err);
      }
    }
  }

  /**
   * Clear entire cache (e.g. on user sign out)
   */
  clearCache() {
    this.cache.clear();
    this.inFlightRequests.clear();
  }

  /**
   * Subscribe to cache invalidation events (e.g., to trigger view updates)
   */
  onInvalidate(listener: (event: { type: "invalidate"; patterns: string[] }) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Ultra-optimized HTTP request method with:
   * 1. Smart TTL In-Memory Caching (eliminates redundant DB hits on tab switching)
   * 2. In-Flight Request Deduplication (prevents concurrent duplicate network requests)
   * 3. Automatic Cache Invalidation on Mutations
   * 4. Resilient Stale-Cache Fallback on Network Interruptions
   */
  async makeRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const method = (options.method || "GET").toUpperCase();
    const isGet = method === "GET";
    const cacheKey = this.buildCacheKey(method, endpoint);

    // 1. Check Cache for GET requests (unless forceRefresh is true)
    if (isGet && !options.forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const isFresh = Date.now() - cached.timestamp < cached.ttl;
        if (isFresh) {
          return {
            ...cached.data,
            fromCache: true,
          };
        }
      }
    }

    // 2. Request Deduplication: If this exact request is currently in-flight, return the existing Promise
    if (isGet && this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)!;
    }

    // 3. Execute Network Request
    const requestPromise = (async (): Promise<ApiResponse<T>> => {
      try {
        const headers = new Headers(options.headers);
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }

        const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
        const url = `${this.baseUrl}${cleanEndpoint}`;

        // Create timeout abort controller to avoid hanging requests (15s timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let response: Response;
        try {
          response = await fetch(url, {
            ...options,
            headers,
            signal: options.signal || controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        const contentType = response.headers.get("content-type") || "";
        let result: any = null;

        if (contentType.includes("application/json")) {
          result = await response.json();
        } else {
          const text = await response.text();
          try {
            result = JSON.parse(text);
          } catch {
            result = { success: response.ok, message: text };
          }
        }

        if (!response.ok) {
          const errorResponse: ApiResponse<T> = {
            success: false,
            statusCode: response.status,
            message: result?.message || `Request failed with status ${response.status}`,
            data: result?.data,
            error: result?.error || "REQUEST_FAILED",
          };

          // If a GET request fails but we have stale cache, serve stale cache as resilient fallback
          if (isGet) {
            const staleCache = this.cache.get(cacheKey);
            if (staleCache) {
              return {
                ...staleCache.data,
                fromCache: true,
              };
            }
          }

          return errorResponse;
        }

        const successResponse: ApiResponse<T> = result ?? { success: true };

        // 4. Update Cache on successful GET
        if (isGet && successResponse.success) {
          const ttl = this.getTtlForEndpoint(endpoint, options.ttlMs);
          this.cache.set(cacheKey, {
            data: successResponse,
            timestamp: Date.now(),
            ttl,
          });
        }

        // 5. Invalidate dependent caches on successful mutations
        if (!isGet && successResponse.success) {
          this.handleMutationInvalidation(endpoint);
        }

        return successResponse;
      } catch (error) {
        // Fallback to stale cache if network drops
        if (isGet) {
          const staleCache = this.cache.get(cacheKey);
          if (staleCache) {
            return {
              ...staleCache.data,
              fromCache: true,
            };
          }
        }

        const errorMessage = error instanceof Error ? error.message : "Network error";
        return {
          success: false,
          message: errorMessage,
          error: "NETWORK_ERROR",
        };
      } finally {
        if (isGet) {
          this.inFlightRequests.delete(cacheKey);
        }
      }
    })();

    if (isGet) {
      this.inFlightRequests.set(cacheKey, requestPromise);
    }

    return requestPromise;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
