/**
 * Query Cache - Request-level caching for database queries
 * Prevents duplicate queries within the same request
 */

type CacheKey = string;
type CacheValue = any;

// Request-level cache (cleared after each request)
const requestCache = new Map<CacheKey, CacheValue>();

export function getCachedQuery<T>(key: string): T | undefined {
  return requestCache.get(key) as T | undefined;
}

export function setCachedQuery<T>(key: string, value: T): void {
  requestCache.set(key, value);
}

export function clearCache(): void {
  requestCache.clear();
}

/**
 * Creates a cache key from function name and parameters
 */
export function createCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

/**
 * Caches a query result for the duration of the request
 */
export async function withQueryCache<T>(
  key: string,
  queryFn: () => Promise<T>
): Promise<T> {
  // Check cache first
  const cached = getCachedQuery<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  // Execute query
  const result = await queryFn();
  
  // Cache result
  setCachedQuery(key, result);
  
  return result;
}

